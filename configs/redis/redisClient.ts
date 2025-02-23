import Redis from "redis";
import { redisClient } from ".";

const acquireLock = async (key: string) => {
  const result = await redisClient.set(key, "locked", {
    NX: true,
    EX: 5, // 10 seconds
  });
  return result ? true : false;
};

const releaseLock = async (key: string) => {
  await redisClient.del(key);
};

const sendToDLQ = async (message: string) => {
  await redisClient.RPUSH("dlq", message); // Send message to Dead Letter Queue (DLQ)
  console.log(`Message sent to DLQ: ${message}`);
};

export { acquireLock, releaseLock, sendToDLQ };
