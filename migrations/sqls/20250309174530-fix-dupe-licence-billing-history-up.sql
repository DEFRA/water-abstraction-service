/*
  Fix bill history caused by edited licence in NALD

  https://eaflood.atlassian.net/browse/WATER-4800

  After spotting that WRLS is carrying a lot of data that no longer exists in NALD because it has been deleted, we have
  started a series of tasks to 'clean up' WRLS licence data.

  One scenario we face is a licence deleted in NALD but linked to a 'sent' bill run in WRLS (see WATER-4734 for more
  details).

  Our queries highlighted `MD/0280003/012`` as one of two licences we found in this state.

  After digging, we connected the dots and realised that `MD/0280003/012` and `MD/028/0003/012` were the same licence.
  Things have broken in WRLS because the licence number has been amended in NALD, resulting in two WRLS records.

  WRLS sees `MD/0280003/012` as a deleted licence because there is no NALD record with the same licence number. The
  problem is that it was only amended in NALD, so our import process has re-linked all its child records (versions,
  purposes, points, etc.) to the WRLS `MD/028/0003/012` record.

  This leaves `MD/0280003/012` as a 'header' record only. For example, the licence summary has very little detail
  because it has no child records to extract the data it needs.

  Leaving the licence in this state puts the service at risk. When we code, we must make assumptions to avoid our logic
  getting out of hand. One assumption is that every licence has at least one version with one purpose and point.

  The solution in this case is to link the existing bill and bill licence records to `MD/028/0003/012` and the
  associated billing account, because if this hadn't happened they would have been created against it in the first
  place.

  The business has also asked us to record a note explaining what has happened (content provided by them).
 */
BEGIN;

-- Update the billing invoices to assign the account against MD/028/0003/012
UPDATE water.billing_invoices AS tgt
SET
  invoice_account_id = (SELECT ia.invoice_account_id FROM crm_v2.invoice_accounts ia WHERE ia.invoice_account_number = 'B88899044A'),
  invoice_account_number = 'B88899044A',
  date_updated = now()
WHERE
  tgt.invoice_account_number = 'B88899074A';

-- Update the billing invoice licences to assign them to MD/028/0003/012
UPDATE water.billing_invoice_licences AS tgt
SET
  licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'MD/028/0003/012'),
  licence_ref = 'MD/028/0003/012',
  date_updated = now()
WHERE
  tgt.licence_ref = 'MD/0280003/012';

-- Add the note requested by the business, linked to the Charge version they specified
INSERT INTO water.notes (
  "text",
  user_id,
  "type",
  type_id
)
SELECT
  'Licence record corrected in NALD, resulting in 2 version in WRLS. Charging data from original incorrect licence number MD/0280003/012 merged to MD/028/0003/012.',
  79,
  'charge_version',
  (
    SELECT
      charge_version_id
    FROM
      water.charge_versions cv
    WHERE
      cv.licence_ref = 'MD/028/0003/012'
      AND cv.start_date = '2021-04-01'
      AND cv.end_date = '2022-03-31'
  )
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      water.notes n
    WHERE
      n.type_id = (
        SELECT
          charge_version_id
        FROM
          water.charge_versions cv
        WHERE
          cv.licence_ref = 'MD/028/0003/012'
          AND cv.start_date = '2021-04-01'
          AND cv.end_date = '2022-03-31'
    )
  );

-- Link the new note requested by the business, to the Charge version they specified (without this step it won't display
-- in the UI)
UPDATE water.charge_versions AS tgt
SET note_id = (
  SELECT
    n.note_id
  FROM
    water.notes n
  WHERE
    n.type_id = (
      SELECT
        charge_version_id
      FROM
        water.charge_versions cv
      WHERE
        cv.licence_ref = 'MD/028/0003/012'
        AND cv.start_date = '2021-04-01'
        AND cv.end_date = '2022-03-31'
    )
  )
WHERE
  tgt.licence_ref = 'MD/028/0003/012'
  AND tgt.start_date = '2021-04-01'
  AND tgt.end_date = '2022-03-31';

COMMIT;
