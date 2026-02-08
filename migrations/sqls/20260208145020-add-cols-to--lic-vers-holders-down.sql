/* Drop the new columns from water.licence_version_holders table */

ALTER TABLE water.licence_version_holders DROP COLUMN derived_name;
ALTER TABLE water.licence_version_holders DROP COLUMN company_id;
ALTER TABLE water.licence_version_holders DROP COLUMN external_id;
