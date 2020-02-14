/* Replace with your SQL commands */
ALTER TABLE water.events ADD COLUMN created timestamp DEFAULT NULL;
ALTER TABLE water.events ADD COLUMN modified timestamp DEFAULT NULL;
UPDATE water.events SET created = created_at, modified = updated_at;
ALTER TABLE water.events DROP COLUMN created_at;
ALTER TABLE water.events DROP COLUMN updated_at;