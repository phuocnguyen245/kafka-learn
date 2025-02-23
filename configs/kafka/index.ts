import { Kafka, logLevel, Partitioners } from "kafkajs";
import config from "../index";

const kafka = new Kafka({
  clientId: "my-app",
  brokers: [config?.KAFKA_HOST],
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  allowAutoTopicCreation: true,
});

const consumer = kafka.consumer({
  groupId: "transaction-processor-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytes: 5242880,
});

// Tạo các topic và partitions
const onKafkaConnect = async () => {
  const admin = kafka.admin();
  await admin.connect();

  const topics = await admin.listTopics();

  if (!topics.includes("transactions")) {
    await admin.createTopics({
      waitForLeaders: true,
      topics: [
        {
          topic: "transactions",
          numPartitions: 3, // Tạo 3 partitions
        },
      ],
    });
    console.log('Topic "transactions" created');
  }

  await admin.disconnect();
};

const onKafkaDisConnect = async () => {
  console.log("kafka disconnected");
  await producer.disconnect();
  await consumer.disconnect();
};

export { kafka, producer, consumer, onKafkaConnect, onKafkaDisConnect };
