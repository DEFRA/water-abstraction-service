-- Remove the include in SROC supplementary billing flag for licences with no charge versions
-- that start after 2022-04-01, or no charge versions at all!
UPDATE water.licences l
SET include_in_sroc_supplementary_billing = FALSE
WHERE
  l.include_in_sroc_supplementary_billing = TRUE
  AND l.licence_id NOT IN (
  SELECT DISTINCT cv.licence_id
  FROM water.charge_versions cv
  WHERE cv.start_date >= '2022-04-01'::Date
)
