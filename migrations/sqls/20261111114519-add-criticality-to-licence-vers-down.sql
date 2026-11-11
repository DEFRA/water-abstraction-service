/* Drop the new columns from water.licence_versions table */

ALTER TABLE water.licence_versions DROP COLUMN criticality_code;
ALTER TABLE water.licence_versions DROP COLUMN criticality_description;
