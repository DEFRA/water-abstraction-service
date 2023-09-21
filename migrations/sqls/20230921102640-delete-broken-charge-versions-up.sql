/* deletes charge versions in the workflow that have incorrect data */
CREATE TEMP TABLE tempChargeVersionId
AS (
    SELECT charge_version_id AS id
    FROM water.charge_version_workflows
    WHERE charge_version_workflow_id = '4fe385f1-a50c-4608-91ee-96a3b15ad3b6'
);
DELETE FROM water.charge_version_workflows WHERE charge_version_workflow_id = '4fe385f1-a50c-4608-91ee-96a3b15ad3b6';
DROP TABLE tempChargeVersionId;