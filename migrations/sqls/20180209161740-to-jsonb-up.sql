ALTER TABLE "crm"."document_header" 
  ALTER COLUMN "metadata" TYPE jsonb USING "metadata"::jsonb;
