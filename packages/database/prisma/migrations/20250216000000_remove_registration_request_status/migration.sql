DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'registration_requests'
  ) THEN
    ALTER TABLE "registration_requests" DROP COLUMN IF EXISTS "status";
  END IF;
END $$;
