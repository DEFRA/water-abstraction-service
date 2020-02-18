/* Replace with your SQL commands */
-- Events created with the new events service will not maintain the modified and created columns
-- so we update the values for modified only because created has a default value when it was created. 
UPDATE water.events SET modified = updated_at WHERE modified IS NULL;
--then drop all the new bookshelf collumns
ALTER TABLE water.events DROP COLUMN created_at;
ALTER TABLE water.events DROP COLUMN updated_at;