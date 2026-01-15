/*
  Adds and populates a new return_log_id UUID field to the table water.review_returns

  https://eaflood.atlassian.net/browse/WATER-5427

  This migration will add a new return_log_id UUID field to the table water.review_returns. It will then populate this
  field with the corresponding id from the returns.returns table based on the return_id foreign key.

  Some review_returns have become orphaned due to deletions in the returns.returns table, so before adding the column
  and its NOT NUL constraint, we clean out review records that are linked to processed bill runs, and any orphaned
  review returns.
*/

-- Delete any review records that are orphaned, just in case any were left behind after a bill run has been cancelled.
DELETE FROM
  water.review_licences rl
WHERE
  NOT EXISTS (
    SELECT 1 FROM water.billing_batches bb WHERE bb.billing_batch_id = rl.bill_run_id
  );

-- Delete any review records linked to processed bill runs. We've these deleted we can then just delete all orphaned
-- review records
DELETE FROM
  water.review_licences rl
WHERE
  EXISTS (
    SELECT 1 FROM water.billing_batches bb WHERE bb.status IN ('sent', 'error') AND bb.billing_batch_id = rl.bill_run_id
  );

DELETE FROM
  water.review_charge_versions rcv
WHERE
  NOT EXISTS (
    SELECT 1 FROM water.review_licences rl WHERE rl.id = rcv.review_licence_id
  );

DELETE FROM
  water.review_charge_references rcr
WHERE
  NOT EXISTS (
    SELECT 1 FROM water.review_charge_versions rcv WHERE rcv.id = rcr.review_charge_version_id
  );

DELETE FROM
  water.review_charge_elements rce
WHERE
  NOT EXISTS (
    SELECT 1 FROM water.review_charge_references rcr WHERE rcr.id = rce.review_charge_reference_id
  );

DELETE FROM
  water.review_charge_element_returns rcer
WHERE
  NOT EXISTS (
    SELECT 1 FROM water.review_charge_elements rce WHERE rce.id = rcer.review_charge_element_id
  );

DELETE FROM
  water.review_returns rcr
WHERE
  NOT EXISTS (
    SELECT 1 FROM water.review_licences rl WHERE rl.id = rcr.review_licence_id
  );

-- Final script to ensure no orphaned records remain
DELETE FROM water.review_returns rr WHERE NOT EXISTS (
  SELECT 1 FROM "returns"."returns" r WHERE r.return_id = rr.return_id
);

BEGIN;
  -- Add the column without NOT NULL constraint first
  ALTER TABLE water.review_returns ADD COLUMN return_log_id UUID;

  -- Populate the column with data from returns table
  DO $$
    BEGIN
      IF EXISTS
        (SELECT 1 FROM information_schema.tables WHERE table_schema = 'returns' AND table_name = 'returns')
      THEN
        UPDATE water.review_returns rr
        SET return_log_id = r.id
        FROM "returns"."returns" r
        WHERE rr.return_id = r.return_id;
      END IF;
    END
  $$;

  -- Now add the NOT NULL constraint after data is populated. All rows should have a valid return_log_id now.
  ALTER TABLE water.review_returns ALTER COLUMN return_log_id SET NOT NULL;
COMMIT;
