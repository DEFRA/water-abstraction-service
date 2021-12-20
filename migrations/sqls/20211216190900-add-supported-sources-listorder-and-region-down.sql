ALTER TABLE "water"."billing_supported_sources" DROP COLUMN IF EXISTS listorder;
ALTER TABLE "water"."billing_supported_sources" DROP COLUMN IF EXISTS regiontag;

delete from water.application_state where key = 'supported-sources-update';