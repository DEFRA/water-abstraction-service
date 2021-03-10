/* Replace with your SQL commands */
DROP INDEX IF EXISTS water.unique_licence_version_id_date_deleted_null;

ALTER TABLE water.charge_version_workflows
ADD CONSTRAINT unique_licence_version_id_date_deleted UNIQUE (licence_version_id, date_deleted);
