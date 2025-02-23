import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const onPrismaConnect = async () => {
  await prisma
    .$connect()
    .then(() => {
      console.log("Prisma connected");
    })
    .catch(() => {
      console.log("Prisma connect failed");
    });
};

const onPrismaDisconnect = async () => {
  await prisma
    .$disconnect()
    .then(() => {
      console.log("Prisma disconnected");
    })
    .catch(() => {
      console.log("Prisma disconnect failed");
    });
};

export { onPrismaConnect, onPrismaDisconnect };
export default prisma;
