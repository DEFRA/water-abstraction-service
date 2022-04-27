/* deletes charge versions that were created from old workflows in review crreated before sroc charge versions were implemented */
CREATE TEMP TABLE tempChargeVersionId
AS (
  SELECT charge_version_id AS id 
  FROM water.charge_elements 
  WHERE scheme = 'alcs' AND abstraction_period_start_day IS NULL
);       
DELETE FROM water.charge_elements WHERE scheme = 'alcs' AND abstraction_period_start_day IS NULL;
DELETE FROM water.charge_versions WHERE charge_version_id in (SELECT id FROM tempChargeVersionId);
DROP TABLE tempChargeVersionId;