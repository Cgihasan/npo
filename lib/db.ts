import { PrismaClient } from "@/prisma/generated/prisma";

declare global {
  var prisma2: PrismaClient | undefined;
}

function getPrisma() {
  if (!globalThis.prisma2) {
    globalThis.prisma2 = new PrismaClient();
  }
  return globalThis.prisma2;
}

// Proxy defers PrismaClient creation until first property access (lazy init)
// This prevents build-time errors when Next.js statically analyzes API routes
const db = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(getPrisma(), prop as keyof PrismaClient);
  },
});

export default db;
