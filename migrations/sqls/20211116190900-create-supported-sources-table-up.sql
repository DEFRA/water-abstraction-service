create table water.billing_supported_sources (
  billing_supported_source_id uuid primary key default public.gen_random_uuid(),
  reference varchar not null,
  name varchar(255) not null,
  date_created timestamp NOT NULL DEFAULT NOW(),
  date_updated timestamp NOT NULL DEFAULT NOW(),
  unique(reference)
);

INSERT INTO water.application_state (application_state_id, key, data, date_created, date_updated)
VALUES ('2c3fbcb1-780f-4b35-8221-f02ab3947b2d', 'supported-sources-import', '{"etag": "etag-will-be-populated-here-after-first-download"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
