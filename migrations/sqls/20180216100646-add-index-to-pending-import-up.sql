
ALTER TABLE "water"."pending_import" DROP CONSTRAINT if exists "pending_import_pkey";



ALTER TABLE "water"."pending_import" ADD COLUMN if not exists id BIGSERIAL PRIMARY KEY;

CREATE UNIQUE INDEX if not exists  "uniq_licence_ref" ON "water"."pending_import" (
  "licence_ref"
);
