import { createClient, RedisClientType } from "redis";
import config from "../index";

const connectionString = {
  url: `redis://${config?.REDIS_HOST}:${config?.REDIS_PORT}`,
  username: config?.REDIS_USERNAME || "",
  password: config?.REDIS_PASSWORD || "",
};

const REDIS_CONNECT_TIMEOUT = 10000,
  REDIS_CONNECT_MESSAGE = {
    code: "500",
    message: "Redis Error",
  };

let timeoutError = null;

let redisClient: RedisClientType = null;
const statusConnectRedis = {
  CONNECT: "connect",
  END: "end",
  RECONNECT: "reconnecting",
  ERROR: "error",
};

const onRedisDisconnect = () => {
  if (redisClient) {
    redisClient.quit();
    redisClient = null;
  }
};

const getRedis = () => redisClient;

const handleTimeoutError = () => {
  timeoutError = setTimeout(() => {
    throw new Error(REDIS_CONNECT_MESSAGE.message);
  }, REDIS_CONNECT_TIMEOUT);
};

const onRedisConnect = async () => {
  try {
    const instanceRedis: RedisClientType = createClient(connectionString);
    console.log("Redis initialized");
    handleRedisEvent(instanceRedis);
    await instanceRedis.connect();
    redisClient = instanceRedis;
  } catch (error) {
    console.error("Redis initialization error:", error);
    throw new Error("Redis initialization failed");
  }
};

const handleRedisEvent = (connectionRedis) => {
  if (connectionRedis) {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
      clearTimeout(timeoutError);
    });

    connectionRedis.on(statusConnectRedis.END, () => {
      console.log("Redis end");
      handleTimeoutError();
    });

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
      console.log("Redis reconnecting");
      clearTimeout(timeoutError);
    });

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
      console.log("Redis error", err);
      handleTimeoutError();
    });
  }
};

export { onRedisDisconnect, getRedis, onRedisConnect, redisClient };
