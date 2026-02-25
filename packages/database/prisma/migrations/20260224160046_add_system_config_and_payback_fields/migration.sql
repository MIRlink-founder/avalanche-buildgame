-- AlterTable
ALTER TABLE "hospitals" ADD COLUMN     "payback_rate" DECIMAL(5,2),
ADD COLUMN     "payback_rate_updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "settlements" ADD COLUMN     "case_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "system_configs" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "description" VARCHAR(500),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");
