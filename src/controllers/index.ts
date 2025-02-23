import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import KafkaProducer from "../../configs/kafka/producer";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.body;
  try {
    const body = await Prisma.validator<Prisma.UserCreateInput>()(user);
    await UserService.createUser(body);
    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const processTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const transaction = req.body;

  try {
    await KafkaProducer.sendToKafka(transaction);
    res.status(201).json({
      success: true,
      message: "Transaction has been processed",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export default { createUser, processTransaction };
