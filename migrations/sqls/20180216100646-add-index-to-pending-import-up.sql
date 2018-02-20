
ALTER TABLE "water"."pending_import" DROP CONSTRAINT IF EXISTS "pending_import_pkey";

ALTER TABLE "water"."pending_import" ADD COLUMN id BIGSERIAL PRIMARY KEY;

CREATE UNIQUE INDEX "uniq_licence_ref" ON "water"."pending_import" (
  "licence_ref"
);
