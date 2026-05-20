import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

declare global {
  var prisma2: PrismaClient | undefined;
}

function getPrisma() {
  if (!globalThis.prisma2) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    globalThis.prisma2 = new PrismaClient({ adapter });
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
