import transactionService from "../../src/services/transaction.service";
import { acquireLock, releaseLock, sendToDLQ } from "../redis/redisClient";
import { consumer } from "./index";

const kafkaConsumerConnect = async () => {
  console.log("Kafka consumer connected");
  await consumer.connect();
};

const kafkaConsumerDisConnect = async () => {
  await consumer.disconnect();
};

const consumeMessages = async () => {
  await consumer.subscribe({ topic: "transactions", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const messageValue = JSON.parse(message.value as unknown as string);
      console.log({ message1: messageValue });
      if (messageValue) {
        const lockKey = `lock:${messageValue.username}`;
        let retries = 0;
        let success = false;

        // Retry logic
        while (retries < 3) {
          const lockAcquired = await acquireLock(lockKey);
          if (lockAcquired) {
            try {
              // Process the transaction
              await transactionService.processTransaction(messageValue);
              success = true;
              console.log(`Processed message: ${messageValue}`);

              // Commit offset after processing successfully
              await consumer.commitOffsets([
                {
                  topic,
                  partition,
                  offset: message.offset,
                },
              ]);
            } catch (error) {
              console.error(`Error processing message: ${messageValue}`, error);
            } finally {
              // Release the lock
              await releaseLock(lockKey);
            }
            break;
          } else {
            console.log(`Lock not acquired for ${messageValue}. Retrying...`);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Retry after 1 second
          }
        }

        if (!success) {
          console.log(
            `Failed to process message ${messageValue.username} after 3 retries. Sending to DLQ.`
          );
          await sendToDLQ(JSON.stringify(messageValue));
        }
      }
    },
  });
};

export default {
  kafkaConsumerConnect,
  kafkaConsumerDisConnect,
  consumeMessages,
};
