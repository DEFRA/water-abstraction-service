ALTER TABLE "water"."billing_supported_sources" ADD COLUMN IF NOT EXISTS "order" int;
ALTER TABLE "water"."billing_supported_sources" ADD COLUMN IF NOT EXISTS region varchar(255);

INSERT INTO water.application_state (application_state_id, key, data, date_created, date_updated)
VALUES ('2d3fbcb1-780f-4b35-8221-f02ab3947b3f', 'supported-sources-update', '{"etag": "etag-will-be-populated-here-after-first-download"}', NOW(), NOW()) ON CONFLICT DO NOTHING;