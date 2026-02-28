import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create the pool with explicit ssl config — do NOT put sslmode in the
// DATABASE_URL, because pg-connection-string parses it and sets
// ssl.rejectUnauthorized=true (treats sslmode=require as verify-full),
// which overrides any ssl option you pass to PrismaPg.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // required for Supabase session pooler (self-signed cert)
    },
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}