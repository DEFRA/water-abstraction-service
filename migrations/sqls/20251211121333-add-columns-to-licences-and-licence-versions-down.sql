/* Revert our changes */

-- Drop the new columns
ALTER TABLE water.licences DROP COLUMN application_number;
ALTER TABLE water.licences DROP COLUMN issue_date;

ALTER TABLE water.licence_versions DROP COLUMN application_number;
ALTER TABLE water.licence_versions DROP COLUMN issue_date;
