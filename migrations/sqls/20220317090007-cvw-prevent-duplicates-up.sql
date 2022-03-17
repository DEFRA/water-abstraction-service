/* Replace with your SQL commands */

DELETE FROM water.charge_version_workflows
WHERE charge_version_workflow_id IN
    (SELECT charge_version_workflow_id
    FROM
        (SELECT charge_version_workflow_id,
         ROW_NUMBER() OVER( PARTITION BY licence_id, data, status, created_by
        ORDER BY  charge_version_workflow_id ) AS row_num
        FROM water.charge_version_workflows ) t
        WHERE t.row_num > 1 );

ALTER TABLE water.charge_version_workflows
ADD CONSTRAINT unique_workflows UNIQUE (licence_id, created_by, status, data);
