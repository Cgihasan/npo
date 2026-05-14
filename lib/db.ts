import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prismaClientSingleton = () => {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  return new PrismaClient({ adapter });
};

declare global {
  var prisma2: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prisma2 ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prisma2 = db;

// Triggering reload for new schema fields
