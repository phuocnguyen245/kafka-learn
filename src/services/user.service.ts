import { User } from "@prisma/client";
import prisma from "../../configs/prisma";

const getUser = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });
  return user;
};

const createUser = async (user: User) => {
  return prisma.user.create({
    data: user,
  });
};

export default { getUser, createUser };
