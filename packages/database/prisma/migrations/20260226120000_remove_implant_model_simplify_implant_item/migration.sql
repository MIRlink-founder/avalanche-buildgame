-- ImplantModel 제거 및 ImplantItem 단순화 (제조사-브랜드-사이즈 구조)
-- 1. medical_record_items 참조 정리 (기존 implant_item_id 무효화)
DELETE FROM "medical_record_items";

-- 2. FK 제거 후 implant_items, implant_models 제거
ALTER TABLE "medical_record_items" DROP CONSTRAINT IF EXISTS "medical_record_items_implant_item_id_fkey";
DROP TABLE IF EXISTS "implant_items";
DROP TABLE IF EXISTS "implant_models";

-- 3. implant_brands에 (manufacturer_id, name) 유니크 추가 (엑셀 upsert용)
CREATE UNIQUE INDEX IF NOT EXISTS "implant_brands_manufacturer_id_name_key" ON "implant_brands"("manufacturer_id", "name");

-- 4. 새 implant_items 테이블 생성 (brand_id, size, status)
CREATE TABLE "implant_items" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "size" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "implant_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "implant_items_brand_id_size_key" ON "implant_items"("brand_id", "size");
CREATE INDEX "implant_items_brand_id_idx" ON "implant_items"("brand_id");

ALTER TABLE "implant_items" ADD CONSTRAINT "implant_items_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "implant_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "medical_record_items" ADD CONSTRAINT "medical_record_items_implant_item_id_fkey" FOREIGN KEY ("implant_item_id") REFERENCES "implant_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
