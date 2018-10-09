/* Replace with your SQL commands */

ALTER TABLE "water"."picklist_items" ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

ALTER TABLE "water"."picklist_items" DROP CONSTRAINT  IF EXISTS uniq_list_id;
CREATE UNIQUE INDEX uniq_list_id ON  "water"."picklist_items"  (picklist_id, LOWER(id));

ALTER TABLE "water"."picklist_items" DROP CONSTRAINT  IF EXISTS uniq_list_value;
CREATE UNIQUE INDEX uniq_list_value ON  "water"."picklist_items" (picklist_id, LOWER(value));




/* Measurement points */
CREATE EXTENSION "uuid-ossp";

INSERT INTO "water"."picklists" (picklist_id, name, id_required, created) VALUES
  ('measurement_point', 'Measurement Point', false, NOW());

INSERT INTO "water"."picklist_items" (picklist_item_id, picklist_id, value, created) VALUES
 (uuid_generate_v4(), 'measurement_point', 'Upstream', NOW()),
 (uuid_generate_v4(), 'measurement_point', 'Downstream', NOW()),
 (uuid_generate_v4(), 'measurement_point', 'NGR', NOW()),
 (uuid_generate_v4(), 'measurement_point', 'Borehole', NOW()),
 (uuid_generate_v4(), 'measurement_point', 'Ref point on map', NOW());
