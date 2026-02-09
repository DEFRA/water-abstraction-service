/* Replace with your SQL commands */

ALTER TABLE water.licence_version_holders ADD COLUMN derived_name TEXT;
ALTER TABLE water.licence_version_holders ADD COLUMN company_id UUID;
ALTER TABLE water.licence_version_holders ADD COLUMN external_id TEXT;
