/* Replace with your SQL commands */
DELETE FROM water.charge_version_workflows;

ALTER TABLE water.charge_version_workflows
DROP CONSTRAINT unique_licence_version_id_date_deleted;

CREATE UNIQUE INDEX unique_licence_version_id_date_deleted_null ON water.charge_version_workflows (licence_version_id) WHERE date_deleted IS NULL;
