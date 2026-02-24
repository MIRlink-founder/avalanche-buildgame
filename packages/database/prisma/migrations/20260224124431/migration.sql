-- DropForeignKey
ALTER TABLE "security_logs" DROP CONSTRAINT "security_logs_user_id_fkey";

-- AlterTable
ALTER TABLE "settlements" ALTER COLUMN "public_id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
