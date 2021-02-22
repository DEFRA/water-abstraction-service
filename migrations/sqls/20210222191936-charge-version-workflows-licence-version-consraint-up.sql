
-- add the licence version id collumn
ALTER TABLE water.charge_version_workflows
ADD COLUMN licence_version_id UUID,
ADD COLUMN date_deleted TIMESTAMP DEFAULT NULL;

-- add the licence_version_id
CREATE TEMP TABLE tmp_top_licence_versions AS
(SELECT * FROM 
 (SELECT *, rank() OVER (PARTITION BY licence_id ORDER BY ranked DESC)
  FROM (SELECT *,LPAD(concat(issue, increment)::text, 9, '0') AS ranked from water.licence_versions) as lvs) AS rankedLicences
WHERE rank = 1);

UPDATE water.charge_version_workflows cw  SET
licence_version_id = lv.licence_version_id 
FROM tmp_top_licence_versions lv
WHERE lv.licence_id = cw.licence_id;

DROP TABLE tmp_top_licence_versions;


--create the constraints
ALTER TABLE water.charge_version_workflows
ADD CONSTRAINT unique_licence_version_id UNIQUE (licence_version_id);
