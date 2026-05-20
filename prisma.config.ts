import { defineConfig } from "prisma/config";
import fs from "fs";
import path from "path";

// Manually read .env file to get DATABASE_URL
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      const value = trimmed.slice("DATABASE_URL=".length);
      // Remove surrounding quotes if present
      const url = value.replace(/^["']|["']$/g, "");
      process.env["DATABASE_URL"] = url;
      break;
    }
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "",
  },
});
