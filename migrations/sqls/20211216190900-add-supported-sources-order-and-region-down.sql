ALTER TABLE "water"."billing_supported_sources" DROP COLUMN IF EXISTS "order";
ALTER TABLE "water"."billing_supported_sources" DROP COLUMN IF EXISTS region;

delete from water.application_state where key = 'supported-sources-update';