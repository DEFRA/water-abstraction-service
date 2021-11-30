CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

/* Replace with your SQL commands */

ALTER TABLE "water"."picklist_items" ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

ALTER TABLE "water"."picklist_items" DROP CONSTRAINT  IF EXISTS uniq_list_id;
CREATE UNIQUE INDEX uniq_list_id ON  "water"."picklist_items"  (picklist_id, LOWER(id));

ALTER TABLE "water"."picklist_items" DROP CONSTRAINT  IF EXISTS uniq_list_value;
CREATE UNIQUE INDEX uniq_list_value ON  "water"."picklist_items" (picklist_id, LOWER(value));




/* Measurement points */
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

INSERT INTO "water"."picklists" (picklist_id, name, id_required, created) VALUES
  ('measurement_point', 'Measurement point', false, NOW());

INSERT INTO "water"."picklist_items" (picklist_item_id, picklist_id, value, created) VALUES
 (public.gen_random_uuid(), 'measurement_point', 'Upstream', NOW()),
 (public.gen_random_uuid(), 'measurement_point', 'Downstream', NOW()),
 (public.gen_random_uuid(), 'measurement_point', 'NGR', NOW()),
 (public.gen_random_uuid(), 'measurement_point', 'Borehole', NOW()),
 (public.gen_random_uuid(), 'measurement_point', 'Ref point on map', NOW());

/* water bodies */
INSERT INTO "water"."picklists" (picklist_id, name, id_required, created) VALUES
  ('water_bodies', 'Water bodies', false, NOW());

/* rate type */
INSERT INTO "water"."picklists" (picklist_id, name, id_required, created) VALUES
    ('rate_type', 'Rate type', false, NOW());

INSERT INTO "water"."picklist_items" (picklist_item_id, picklist_id, value, created) VALUES
   (public.gen_random_uuid(), 'rate_type', 'Instantaneous', NOW()),
   (public.gen_random_uuid(), 'rate_type', 'Hourly', NOW()),
   (public.gen_random_uuid(), 'rate_type', 'Daily', NOW());

 /* gauging stations */
 INSERT INTO "water"."picklists" (picklist_id, name, id_required, created) VALUES
   ('gauging_stations', 'Gauging stations', true, NOW());
