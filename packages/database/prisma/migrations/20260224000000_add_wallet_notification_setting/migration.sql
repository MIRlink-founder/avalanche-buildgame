-- CreateTable
CREATE TABLE "wallet_notification_settings" (
    "id" SERIAL NOT NULL,
    "min_balance_avax" VARCHAR(50) NOT NULL,
    "notification_email" VARCHAR(100) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_notification_settings_pkey" PRIMARY KEY ("id")
);
