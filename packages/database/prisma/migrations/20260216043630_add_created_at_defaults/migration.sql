/*
  Warnings:

  - You are about to drop the column `status` on the `registration_requests` table. All the data in the column will be lost.
  - Made the column `created_at` on table `implant_brands` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `implant_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `implant_models` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `manufacturers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `medical_record_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `medical_records` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `medical_records` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `test_payment_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `tokens` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "implant_brands" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "implant_items" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "implant_models" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "manufacturers" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "medical_record_items" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "medical_records" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "registration_requests" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "test_payment_sessions" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tokens" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "payment_idempotencies" (
    "id" SERIAL NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "operation" VARCHAR(20) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "response" JSONB,
    "payment_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_idempotencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_idempotencies_idempotency_key_key" ON "payment_idempotencies"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_idempotencies_status_idx" ON "payment_idempotencies"("status");

-- AddForeignKey
ALTER TABLE "payment_idempotencies" ADD CONSTRAINT "payment_idempotencies_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
