package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

type Transaction struct {
	Username string `json:"username"`
	Amount   int    `json:"amount"`
	Type     string `json:"type"`
}

var (
	mu           sync.Mutex
	successCount int
	failCount    int
	totalTime    time.Duration
)

func generateTransaction(index int) Transaction {
	username := fmt.Sprintf("user%s", generateString(index))

	transactionType := "debit"
	if index%2 == 0 {
		transactionType = "credit"
	}
	return Transaction{
		Username: username,
		Amount:   100,
		Type:     transactionType,
	}
}

func generateString(index int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz"
	result := make([]byte, 6)
	for i := 5; i >= 0; i-- {
		result[i] = charset[index%len(charset)]
		index /= len(charset)
	}
	return string(result)
}

func makeAPICall(url string, transaction Transaction) error {
	body, _ := json.Marshal(transaction)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("secret-key", "S0LXUKDOQ792")

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}

func callAPI(transaction Transaction, wg *sync.WaitGroup) {
	defer wg.Done()

	start := time.Now()

	// Simulate API call
	if err := makeAPICall("http://localhost:8000/transactions", transaction); err != nil {
		fmt.Println("Error calling API:", err)
		mu.Lock()
		failCount++
		mu.Unlock()
		return
	}

	duration := time.Since(start)

	mu.Lock()
	successCount++
	totalTime += duration
	mu.Unlock()

	fmt.Printf("Transaction %s called API successfully\n", transaction.Username)
}

func main() {
	rand.Seed(time.Now().UnixNano())
	var wg sync.WaitGroup

	m := 5000 // Number of users

	startTime := time.Now()

	for i := range m {
		transaction := generateTransaction(i)
		wg.Add(1)
		time.Sleep(100 * time.Microsecond)
		go callAPI(transaction, &wg)
	}

	wg.Wait()

	totalDuration := time.Since(startTime)

	mu.Lock()
	totalCalls := successCount + failCount
	successRate := float64(successCount) / float64(totalCalls) * 100
	averageTime := totalTime / time.Duration(totalCalls)
	mu.Unlock()

	fmt.Printf("Total API calls: %d\n", totalCalls)
	fmt.Printf("Successful API calls: %d\n", successCount)
	fmt.Printf("Failed API calls: %d\n", failCount)
	fmt.Printf("Success rate: %.2f%%\n", successRate)
	fmt.Printf("Average time per call: %s\n", averageTime)
	fmt.Printf("Total time taken: %s\n", totalDuration)
	fmt.Printf("Average requests per second: %.2f\n", float64(totalCalls)/totalDuration.Seconds())
}
