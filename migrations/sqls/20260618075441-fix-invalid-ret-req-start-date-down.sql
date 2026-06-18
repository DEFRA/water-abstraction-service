/* Revert the data fix */

UPDATE water.return_requirements rr
SET
  abstraction_period_start_day = 31
WHERE
  rr.external_id = '1:7998';
