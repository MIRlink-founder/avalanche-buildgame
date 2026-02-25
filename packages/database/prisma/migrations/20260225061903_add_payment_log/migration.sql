-- CreateTable
CREATE TABLE "payment_logs" (
    "id" SERIAL NOT NULL,
    "hospital_id" UUID,
    "sub_mid" VARCHAR(50) NOT NULL,
    "approve_no" VARCHAR(50),
    "amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "pg_transaction_id" VARCHAR(100),
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "raw_payload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_logs_sub_mid_idx" ON "payment_logs"("sub_mid");

-- CreateIndex
CREATE INDEX "payment_logs_approve_no_idx" ON "payment_logs"("approve_no");

-- CreateIndex
CREATE INDEX "payment_logs_hospital_id_paid_at_idx" ON "payment_logs"("hospital_id", "paid_at");

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
