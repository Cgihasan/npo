import { PrismaClient } from "@/prisma/generated/prisma";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma2: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prisma2 ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prisma2 = db;
