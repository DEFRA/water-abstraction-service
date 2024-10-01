/*
  Data fix for Licence WA/055/0015/022

  https://eaflood.atlassian.net/browse/WATER-4686

  Back in June, `WA/055/0015/022` was flagged to us as having been raised twice in NALD and, therefore, causing an issue
  with the import. The duplication was because the licence was first set up against the Midland region and then again
  against Wales. Midlands is the correct region, so they deleted that one in NALD when the problem was spotted.

  However, because of the nightly import, WRLS's licence record was set up against the Midland region. We don't update
  the region when importing licence information, so when the record was deleted in NALD, our version stayed with the
  Midland region. Since then, a Midland annual bill run has been created and sent.

  So, to fix the licence, we need to

  - correct the region the `water.licences` is against
  - delete any `water.licence_versions` linked to the deleted NALD licence
  - delete any `water.licence_version_purposes` linked to the deleted NALD licence
  - delete any `water.licence_version_purpose_conditions` linked to the deleted NALD licence

  We also need to create new charge information. The header `water.charge_versions` record is also linked to a region. We can't delete or correct what is there because it is linked to a 'sent' bill. So, we duplicate the existing charge information, assign the correct region, and then mark the existing as 'superseded'.

  > Note: We checked return versions (there are none), `crm.document_headers`, `crm_v2.documents` and `permit.licence` records and all are linked to and being updated from the correct NALD licence record
*/
BEGIN;

-- Mark current charge information as superseded
UPDATE water.charge_versions SET status = 'superseded' WHERE licence_ref = 'WA/055/0015/022';

-- Create replacement charge information
-- New charge version
INSERT INTO water.charge_versions (
  licence_ref,
  scheme,
  version_number,
  start_date,
  status,
  apportionment,
  end_date,
  region_code,
  "source",
  company_id,
  invoice_account_id,
  change_reason_id,
  created_by,
  approved_by,
  licence_id
)
SELECT
  cv.licence_ref,
  cv.scheme,
  (cv.version_number + 1) AS version_number,
  cv.start_date,
  'current' AS status,
  cv.apportionment,
  cv.end_date,
  8 AS region_code,
  cv."source",
  cv.company_id,
  cv.invoice_account_id,
  cv.change_reason_id,
  cv.created_by,
  cv.approved_by,
  cv.licence_id
FROM
  water.charge_versions cv
WHERE
  cv.licence_ref = 'WA/055/0015/022' AND cv.status = 'superseded';

-- New charge reference
INSERT INTO water.charge_elements (
  charge_version_id,
  abstraction_period_start_day,
  abstraction_period_start_month,
  abstraction_period_end_day,
  abstraction_period_end_month,
  authorised_annual_quantity,
  season,
  season_derived,
  "source",
  loss,
  factors_overridden,
  billable_annual_quantity,
  time_limited_start_date,
  time_limited_end_date,
  description,
  purpose_primary_id,
  purpose_secondary_id,
  purpose_use_id,
  is_section_127_agreement_enabled,
  scheme,
  is_restricted_source,
  water_model,
  volume,
  billing_charge_category_id,
  additional_charges,
  adjustments,
  is_section_126_agreement_enabled,
  is_section_130_agreement_enabled,
  eiuc_region
)
SELECT
  (
    SELECT
      cv.charge_version_id
    FROM
      water.charge_versions cv
    WHERE
      cv.licence_ref = 'WA/055/0015/022'
      AND cv.status = 'current'
  ) AS charge_version_id,
  ce.abstraction_period_start_day,
  ce.abstraction_period_start_month,
  ce.abstraction_period_end_day,
  ce.abstraction_period_end_month,
  ce.authorised_annual_quantity,
  ce.season,
  ce.season_derived,
  ce."source",
  ce.loss,
  ce.factors_overridden,
  ce.billable_annual_quantity,
  ce.time_limited_start_date,
  ce.time_limited_end_date,
  ce.description,
  ce.purpose_primary_id,
  ce.purpose_secondary_id,
  ce.purpose_use_id,
  ce.is_section_127_agreement_enabled,
  ce.scheme,
  ce.is_restricted_source,
  ce.water_model,
  ce.volume,
  ce.billing_charge_category_id,
  ce.additional_charges,
  ce.adjustments,
  ce.is_section_126_agreement_enabled,
  ce.is_section_130_agreement_enabled,
  ce.eiuc_region
FROM
  water.charge_elements ce
WHERE
  ce.charge_version_id = (
    SELECT
      cv.charge_version_id
    FROM
      water.charge_versions cv
    WHERE
      cv.licence_ref = 'WA/055/0015/022'
      AND cv.status = 'superseded'
  );

-- New charge element
INSERT INTO water.charge_purposes (
  charge_element_id,
  abstraction_period_start_day,
  abstraction_period_start_month,
  abstraction_period_end_day,
  abstraction_period_end_month,
  authorised_annual_quantity,
  loss,
  factors_overridden,
  billable_annual_quantity,
  time_limited_start_date,
  time_limited_end_date,
  description,
  purpose_primary_id,
  purpose_secondary_id,
  purpose_use_id,
  is_section_127_agreement_enabled
)
SELECT
  (
    SELECT
      ce.charge_element_id
    FROM
      water.charge_elements ce
    WHERE
      ce.charge_version_id = (
        SELECT
          cv.charge_version_id
        FROM
          water.charge_versions cv
        WHERE
          cv.licence_ref = 'WA/055/0015/022'
          AND cv.status = 'current'
      )
  ) AS charge_element_id,
  cp.abstraction_period_start_day,
  cp.abstraction_period_start_month,
  cp.abstraction_period_end_day,
  cp.abstraction_period_end_month,
  cp.authorised_annual_quantity,
  cp.loss,
  cp.factors_overridden,
  cp.billable_annual_quantity,
  cp.time_limited_start_date,
  cp.time_limited_end_date,
  cp.description,
  cp.purpose_primary_id,
  cp.purpose_secondary_id,
  cp.purpose_use_id,
  cp.is_section_127_agreement_enabled
FROM
  water.charge_purposes cp
WHERE
  cp.charge_element_id = (
    SELECT
      charge_element_id
    FROM
      water.charge_elements
    WHERE
      charge_version_id = (
        SELECT
          cv.charge_version_id
        FROM
          water.charge_versions cv
        WHERE
          cv.licence_ref = 'WA/055/0015/022'
          AND cv.status = 'superseded'
      )
  );

-- Delete orphaned records linked to old deleted NALD licence record
DELETE FROM water.licence_version_purpose_conditions lvpc WHERE lvpc.licence_version_purpose_id IN (
  SELECT lvp.licence_version_purpose_id FROM water.licence_version_purposes lvp
  INNER JOIN water.licence_versions lv ON lv.licence_version_id = lvp.licence_version_id
  WHERE lv.external_id = '2:10029558:1:0'
);

DELETE FROM water.licence_version_purposes lvp WHERE lvp.licence_version_id IN (
  SELECT lv.licence_version_id FROM water.licence_versions lv
  WHERE lv.external_id = '2:10029558:1:0'
);

DELETE FROM water.licence_versions lv WHERE lv.external_id = '2:10029558:1:0';

-- Finally, correct the region linked to the licence
UPDATE
  water.licences
SET
  region_id = (SELECT region_id FROM water.regions WHERE nald_region_id = 8)
WHERE
  licence_ref = 'WA/055/0015/022';

COMMIT;
