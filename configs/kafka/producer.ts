import { Transaction } from "@prisma/client";
import { producer } from "./index";

const kafkaProducerConnect = async () => {
  await producer.connect();
  console.log("Producer connected to Kafka");
};

const kafkaProducerDisConnect = async () => {
  await producer.disconnect();
};

const sendToKafka = async (message: Transaction) => {
  try {
    await producer.send({
      topic: "transactions",
      messages: [{ value: JSON.stringify(message), key: message.username }],
    });
    console.log("Message sent to Kafka:", message);
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
    throw error;
  }
};

export default { kafkaProducerConnect, kafkaProducerDisConnect, sendToKafka };
