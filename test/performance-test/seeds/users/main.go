package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
)

type User struct {
	Username string `json:"username"`
	Balance  int    `json:"balance"`
}

var (
	mu           sync.Mutex
	successCount int
	failCount    int
)

func generateUser(index int) User {
	mu.Lock()
	defer mu.Unlock()

	username := fmt.Sprintf("user%s", generateString(index))

	return User{
		Username: username,
		Balance:  1000000,
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

func makeAPICall(url string, user User) (string, error) {
	body, _ := json.Marshal(user)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-access-token", " eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdXBlcmFkbWluIiwidXNlcklkIjpudWxsLCJpYXQiOjE3NDAwNzU2NzUsImV4cCI6MTc0MDA4Mjg3NX0.HxsMpL5D_uXrq8kNaHRT6PiVPiN_IQFc9cKOl8p3ioI")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	resp.Body.Close()
	return resp.Status, err
}

func main() {

	for i := range 100000 {
		user := generateUser(i)
		status, err := makeAPICall("http://localhost:8000/users", user)
		fmt.Printf("Status: %s\n", user)
		mu.Lock()
		fmt.Printf("Status: %s\n", status)
		if err != nil {
			failCount++
			fmt.Printf("Error: %s\n", err)
		} else {
			successCount++
		}
		mu.Unlock()
	}

	fmt.Printf("Success: %d\n", successCount)
	fmt.Printf("Fail: %d\n", failCount)
	log.Fatal("Done")
}
