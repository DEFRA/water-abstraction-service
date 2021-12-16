ALTER TABLE "water"."billing_supported_sources" DROP COLUMN IF EXISTS listorder;
ALTER TABLE "water"."billing_supported_sources" DROP COLUMN IF EXISTS regiontag;

INSERT INTO water.application_state (application_state_id, key, data, date_created, date_updated)
VALUES ('2c3fbcb1-780f-4b35-8221-f02ab3947b2f', 'supported-sources-import', '{"etag": "etag-will-be-populated-here-after-first-download"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
