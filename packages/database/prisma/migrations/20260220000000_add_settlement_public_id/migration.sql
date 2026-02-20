ALTER TABLE "settlements" ADD COLUMN "public_id" UUID;

UPDATE "settlements"
SET "public_id" = gen_random_uuid()
WHERE "public_id" IS NULL;

ALTER TABLE "settlements"
ALTER COLUMN "public_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "settlements"
ALTER COLUMN "public_id" SET NOT NULL;

CREATE UNIQUE INDEX "settlements_public_id_key" ON "settlements"("public_id");
