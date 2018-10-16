/* Replace with your SQL commands */
DROP INDEX uniq_list_id;
DROP INDEX uniq_list_value;

ALTER TABLE "water"."picklist_items" DROP COLUMN IF EXISTS "hidden";

ALTER TABLE "water"."picklist_items" ADD CONSTRAINT uniq_list_id UNIQUE (picklist_id, id);
ALTER TABLE "water"."picklist_items" ADD CONSTRAINT uniq_list_value UNIQUE (picklist_id, value);
