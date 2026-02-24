CREATE TABLE "security_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "security_logs_user_id_idx" ON "security_logs"("user_id");
CREATE INDEX "security_logs_action_idx" ON "security_logs"("action");
CREATE INDEX "security_logs_created_at_idx" ON "security_logs"("created_at");
