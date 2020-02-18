/* Replace with your SQL commands */
ALTER TABLE water.events ADD COLUMN created_at timestamp DEFAULT now();
ALTER TABLE water.events ADD COLUMN updated_at timestamp DEFAULT null;
UPDATE water.events SET created_at = created, updated_at = modified;