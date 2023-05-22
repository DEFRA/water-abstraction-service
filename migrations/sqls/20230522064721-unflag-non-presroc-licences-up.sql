-- Remove the include in supplementary billing flag for licences with charge versions
-- that only start after 2022-04-01, or no charge versions at all!
UPDATE water.licences l
SET include_in_supplementary_billing = 'no'
WHERE
  l.include_in_supplementary_billing = 'yes'
  AND l.licence_id NOT IN (
  SELECT DISTINCT cv.licence_id
  FROM water.charge_versions cv
  WHERE cv.start_date < '2022-04-01'::Date
)
