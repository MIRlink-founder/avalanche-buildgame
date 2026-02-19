-- CreateTable
CREATE TABLE "hospitals" (
    "id" UUID NOT NULL,
    "business_number" VARCHAR(20) NOT NULL,
    "official_name" VARCHAR(200) NOT NULL,
    "display_name" VARCHAR(100),
    "ceo_name" VARCHAR(50) NOT NULL,
    "ceo_birth_date" DATE,
    "business_address" VARCHAR(500) NOT NULL,
    "medical_license_number" VARCHAR(50),
    "healthcare_institution_code" VARCHAR(8),
    "business_type" VARCHAR(50),
    "account_bank" VARCHAR(20),
    "account_number" VARCHAR(50),
    "account_holder" VARCHAR(50),
    "manager_name" VARCHAR(50),
    "manager_phone" VARCHAR(20),
    "manager_email" VARCHAR(100),
    "existing_van_company" VARCHAR(50),
    "existing_terminal_id" VARCHAR(50),
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_documents" (
    "id" SERIAL NOT NULL,
    "hospital_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" BIGINT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_requests" (
    "id" SERIAL NOT NULL,
    "hospital_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" SERIAL NOT NULL,
    "hospital_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "withdrawal_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_memos" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "hospital_id" UUID,
    "department_id" INTEGER,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "status_changed_at" TIMESTAMP(3),
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" VARCHAR(500) NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_pins" (
    "id" UUID NOT NULL,
    "user_card_key" TEXT,
    "pin_number" VARCHAR(100),

    CONSTRAINT "patient_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "hospital_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" SERIAL NOT NULL,
    "patient_id" VARCHAR(50) NOT NULL,
    "hospital_id" UUID NOT NULL,
    "department_id" INTEGER,
    "doctor_id" UUID NOT NULL,
    "encrypted_chart_data" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "treated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_record_stats" (
    "id" SERIAL NOT NULL,
    "medical_record_id" INTEGER NOT NULL,
    "patient_age_group" VARCHAR(10),
    "patient_gender" VARCHAR(10),
    "is_high_risk" BOOLEAN,
    "procedure_type" VARCHAR(50),
    "procedure_site" VARCHAR(50),
    "tooth_position" VARCHAR(10),
    "bone_graft_used" BOOLEAN,
    "bone_graft_material" VARCHAR(50),
    "bone_quality" VARCHAR(10),
    "surgery_method" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_record_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_record_items" (
    "id" SERIAL NOT NULL,
    "medical_record_id" INTEGER NOT NULL,
    "implant_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "medical_record_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "medical_record_id" INTEGER NOT NULL,
    "hospital_id" UUID NOT NULL,
    "settlement_id" INTEGER,
    "sub_mid" VARCHAR(50) NOT NULL,
    "approve_no" VARCHAR(50),
    "pg_transaction_id" VARCHAR(100),
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_payment_sessions" (
    "id" SERIAL NOT NULL,
    "hospital_id" UUID NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "test_tx_id" VARCHAR(100),
    "test_amount" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "verify_status" VARCHAR(20),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "void_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3),

    CONSTRAINT "test_payment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" SERIAL NOT NULL,
    "hospital_id" UUID NOT NULL,
    "settlement_period_start" DATE NOT NULL,
    "settlement_period_end" DATE NOT NULL,
    "total_volume" DECIMAL(15,2) NOT NULL,
    "applied_rate" DECIMAL(5,2) NOT NULL,
    "payback_amount" DECIMAL(15,2) NOT NULL,
    "is_nft_boosted" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL,
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transfers" (
    "id" SERIAL NOT NULL,
    "settlement_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "bank_name" VARCHAR(20) NOT NULL,
    "transfer_status" VARCHAR(20),
    "transfer_result" TEXT,
    "transferred_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_transactions" (
    "id" SERIAL NOT NULL,
    "medical_record_id" INTEGER NOT NULL,
    "tx_hash" VARCHAR(100) NOT NULL,
    "data_hash" VARCHAR(100) NOT NULL,
    "block_number" BIGINT,
    "status" VARCHAR(20) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfts" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "token_id" VARCHAR(100) NOT NULL,
    "contract_address" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "minted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country" VARCHAR(50),
    "created_at" TIMESTAMP(3),

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implant_brands" (
    "id" SERIAL NOT NULL,
    "manufacturer_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "implant_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implant_models" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "implant_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implant_items" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "diameter" DECIMAL(4,2) NOT NULL,
    "length" DECIMAL(4,2) NOT NULL,
    "surface_treatment" VARCHAR(50),
    "connection_type" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "implant_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_requests" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "item_type" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "recipient_name" VARCHAR(50),
    "recipient_phone" VARCHAR(20),
    "delivery_address" VARCHAR(500),
    "delivery_zipcode" VARCHAR(10),
    "status" VARCHAR(20),
    "processed_by" UUID,
    "processed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "target_group" VARCHAR(20),
    "target_hospital_id" UUID,
    "target_role" VARCHAR(20),
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_attachments" (
    "id" SERIAL NOT NULL,
    "notice_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "answer_content" TEXT,
    "answered_by" UUID,
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_attachments" (
    "id" SERIAL NOT NULL,
    "inquiry_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "entity_type" VARCHAR(20),
    "entity_id" INTEGER,
    "recipient_id" INTEGER,
    "recipient_email" VARCHAR(100),
    "channel" VARCHAR(20),
    "title" VARCHAR(200),
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" UUID NOT NULL,
    "token_type" VARCHAR(20) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "user_id" UUID,
    "hospital_id" UUID,
    "department_id" INTEGER,
    "email" VARCHAR(100),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_business_number_key" ON "hospitals"("business_number");

-- CreateIndex
CREATE INDEX "hospitals_business_number_idx" ON "hospitals"("business_number");

-- CreateIndex
CREATE INDEX "hospitals_status_idx" ON "hospitals"("status");

-- CreateIndex
CREATE INDEX "hospitals_type_idx" ON "hospitals"("type");

-- CreateIndex
CREATE INDEX "hospitals_healthcare_institution_code_idx" ON "hospitals"("healthcare_institution_code");

-- CreateIndex
CREATE INDEX "hospital_documents_hospital_id_idx" ON "hospital_documents"("hospital_id");

-- CreateIndex
CREATE INDEX "hospital_documents_document_type_idx" ON "hospital_documents"("document_type");

-- CreateIndex
CREATE INDEX "hospital_memos_hospital_id_idx" ON "hospital_memos"("hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_hospital_id_role_idx" ON "users"("hospital_id", "role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_access_token_key" ON "auth_sessions"("access_token");

-- CreateIndex
CREATE INDEX "auth_sessions_access_token_idx" ON "auth_sessions"("access_token");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "departments_hospital_id_idx" ON "departments"("hospital_id");

-- CreateIndex
CREATE INDEX "medical_records_patient_id_idx" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "medical_records_hospital_id_idx" ON "medical_records"("hospital_id");

-- CreateIndex
CREATE INDEX "medical_records_status_idx" ON "medical_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_record_stats_medical_record_id_key" ON "medical_record_stats"("medical_record_id");

-- CreateIndex
CREATE INDEX "medical_record_stats_patient_age_group_idx" ON "medical_record_stats"("patient_age_group");

-- CreateIndex
CREATE INDEX "medical_record_stats_procedure_type_idx" ON "medical_record_stats"("procedure_type");

-- CreateIndex
CREATE INDEX "medical_record_items_medical_record_id_idx" ON "medical_record_items"("medical_record_id");

-- CreateIndex
CREATE INDEX "medical_record_items_implant_item_id_idx" ON "medical_record_items"("implant_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_medical_record_id_key" ON "payments"("medical_record_id");

-- CreateIndex
CREATE INDEX "payments_sub_mid_idx" ON "payments"("sub_mid");

-- CreateIndex
CREATE INDEX "payments_approve_no_idx" ON "payments"("approve_no");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_hospital_id_paid_at_idx" ON "payments"("hospital_id", "paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "test_payment_sessions_session_token_key" ON "test_payment_sessions"("session_token");

-- CreateIndex
CREATE INDEX "settlements_hospital_id_idx" ON "settlements"("hospital_id");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "settlements"("status");

-- CreateIndex
CREATE INDEX "settlements_settlement_period_start_settlement_period_end_idx" ON "settlements"("settlement_period_start", "settlement_period_end");

-- CreateIndex
CREATE INDEX "bank_transfers_settlement_id_idx" ON "bank_transfers"("settlement_id");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_medical_record_id_key" ON "blockchain_transactions"("medical_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_tx_hash_key" ON "blockchain_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_transactions_tx_hash_idx" ON "blockchain_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_transactions_medical_record_id_idx" ON "blockchain_transactions"("medical_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "nfts_token_id_key" ON "nfts"("token_id");

-- CreateIndex
CREATE INDEX "nfts_hospital_id_idx" ON "nfts"("hospital_id");

-- CreateIndex
CREATE INDEX "nfts_token_id_idx" ON "nfts"("token_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_name_key" ON "manufacturers"("name");

-- CreateIndex
CREATE INDEX "implant_items_model_id_idx" ON "implant_items"("model_id");

-- CreateIndex
CREATE INDEX "implant_items_diameter_length_idx" ON "implant_items"("diameter", "length");

-- CreateIndex
CREATE INDEX "supply_requests_hospital_id_idx" ON "supply_requests"("hospital_id");

-- CreateIndex
CREATE INDEX "supply_requests_status_idx" ON "supply_requests"("status");

-- CreateIndex
CREATE INDEX "notices_status_idx" ON "notices"("status");

-- CreateIndex
CREATE INDEX "notices_created_at_idx" ON "notices"("created_at");

-- CreateIndex
CREATE INDEX "inquiries_hospital_id_idx" ON "inquiries"("hospital_id");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "inquiries_created_at_idx" ON "inquiries"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_categories_name_key" ON "inquiry_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- AddForeignKey
ALTER TABLE "hospital_documents" ADD CONSTRAINT "hospital_documents_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_memos" ADD CONSTRAINT "hospital_memos_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_memos" ADD CONSTRAINT "hospital_memos_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_stats" ADD CONSTRAINT "medical_record_stats_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_items" ADD CONSTRAINT "medical_record_items_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_items" ADD CONSTRAINT "medical_record_items_implant_item_id_fkey" FOREIGN KEY ("implant_item_id") REFERENCES "implant_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_payment_sessions" ADD CONSTRAINT "test_payment_sessions_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implant_brands" ADD CONSTRAINT "implant_brands_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implant_models" ADD CONSTRAINT "implant_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "implant_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implant_items" ADD CONSTRAINT "implant_items_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "implant_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_requests" ADD CONSTRAINT "supply_requests_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_requests" ADD CONSTRAINT "supply_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_requests" ADD CONSTRAINT "supply_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_attachments" ADD CONSTRAINT "notice_attachments_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "notices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inquiry_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
