create table water.billing_charge_categories (
  billing_charge_category_id uuid primary key default public.gen_random_uuid(),
  reference varchar not null,
  subsistence_charge int not null,
  description varchar not null,
  short_description varchar(150) not null,
  date_created timestamp not null,
  date_updated timestamp,
  unique(reference)
);

INSERT INTO water.application_state (application_state_id, key, data, date_created, date_updated)
VALUES ('2b3fbcb1-780f-4b35-8221-f02ab3947b1b', 'charge-categories-import', '{"etag": "etag-will-be-populated-here-after-first-download"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
