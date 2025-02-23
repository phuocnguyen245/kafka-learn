import express, {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";
import { onKafkaConnect, onKafkaDisConnect } from "./configs/kafka";
import { onPrismaConnect, onPrismaDisconnect } from "./configs/prisma";
import { onRedisConnect, onRedisDisconnect } from "./configs/redis";
import router from "./src/routers";
import KafkaProducer from "./configs/kafka/producer";
import KafkaConsumer from "./configs/kafka/consumer";

const app = express();
const port = 8000;

// Middleware to parse body
app.use(express.json());

app.use("/", router);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error("Not found");
  (error as any).statusCode = 404;
  next(error);
});

app.use(((error: any, _req: Request, res: Response) => {
  const statusCode = error.statusCode || "500";
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    status: "Error",
    code: statusCode,
    message,
  });
}) as ErrorRequestHandler);

// Start server
const onConnect = async () => {
  try {
    await onPrismaConnect();
    await onRedisConnect();
    await onKafkaConnect();
    await KafkaProducer.kafkaProducerConnect();
    await KafkaConsumer.kafkaConsumerConnect();
    // Add this line to start consuming messages
    await KafkaConsumer.consumeMessages();
    console.log("Consumer started listening for messages");
  } catch (error) {
    console.error("Error during connection:", error);
    process.exit(1); // Exit the process with failure
  }
};

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  try {
    await onPrismaDisconnect();
    await onRedisDisconnect();
    await onKafkaDisConnect();
    await KafkaProducer.kafkaProducerDisConnect();
    await KafkaConsumer.kafkaConsumerDisConnect();
  } catch (error) {
    console.error("Error during disconnection:", error);
  } finally {
    process.exit(0); // Exit the process
  }
};

async function startServer() {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  await onConnect();
}

startServer();

// Listen for SIGTERM (default termination signal) and SIGINT (Ctrl+C)
process.on("SIGTERM", async () => await shutdown("SIGTERM"));
process.on("SIGINT", async () => await shutdown("SIGINT"));
