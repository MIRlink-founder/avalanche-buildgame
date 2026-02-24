-- AlterTable
ALTER TABLE "blockchain_transactions" ADD COLUMN IF NOT EXISTS "gas_used" BIGINT;
