import { Transaction, TransactionType } from "@prisma/client";
import prisma from "../../configs/prisma";
import { redisClient } from "../../configs/redis";

const processTransaction = async (payload: Transaction) => {
  let transactionSuccessful = false;

  await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { username: payload.username },
      data: {
        balance: {
          ...(payload.type === TransactionType.credit
            ? {
                increment: payload.amount,
              }
            : {
                decrement: payload.amount,
              }),
        },
      },
    });

    if (updatedUser.balance < 0) {
      throw new Error(`User not have enough money`);
    }

    await tx.transaction.create({
      data: payload,
    });

    transactionSuccessful = true;
  });

  if (transactionSuccessful) {
    await redisClient.set(payload.username, payload.amount); // Update Redis
  }
};

export default { processTransaction };
