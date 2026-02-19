-- AlterTable
ALTER TABLE "hospitals" ADD COLUMN "address_zipcode" VARCHAR(10),
ADD COLUMN "address_road" VARCHAR(500),
ADD COLUMN "address_detail" VARCHAR(200);
