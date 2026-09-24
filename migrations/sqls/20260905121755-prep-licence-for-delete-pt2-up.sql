/*
  https://eaflood.atlassian.net/browse/WATER-5039

  We have a licence in WRLS that we know has been deleted in NALD. But we can't delete it because it is linked to two bills.

  To resolve the issue, we first need to make the licence non-chargeable, then run a supplementary bill run for it.

  [Part 1](https://github.com/DEFRA/water-abstraction-service/pull/2850) created the charge version history that meant the next supplementary bill run would result in the credits needed.

  Once that script has been applied, and the bills generated and sent, we are then in a position to update the bills and transactions to point to the correct licence record.

  This data fix migration handles that second part.
*/

DO $$
BEGIN
  -- Only attempt to apply the fix in environments where the licence exists and has charge versions.
  IF EXISTS
    (
      SELECT
        1
      FROM
        water.licences l
      WHERE
        l.licence_ref = 'SW/050/008/034'
        AND EXISTS (
          SELECT
            1
          FROM
            water.charge_versions cv
          WHERE
            cv.licence_ref = 'SW/050/008/034'
        )
    )
  THEN
    -- The annual bill run for 2024/25 has both licences linked to the same bill. We can't just update the
    -- water.billing_invoice_licences (BIL) record to point to the correct licence, because there is a constraint that
    -- blocks two records having the same billing_invoice_id and licence_id.
    -- So, we start by moving the transactions linked to the SW/050/008/034 BIL to the SW/050/0008/034 BIL.
    WITH annual_bill_run AS (
      SELECT
        bb.billing_batch_id
      FROM
        water.billing_batches bb
      WHERE
        bb.batch_type = 'annual'
        AND bb.to_financial_year_ending = 2025
        AND bb.region_id = (
          SELECT
            r.region_id
          FROM
            water.regions r
          WHERE
            r.nald_region_id = 5
        )
    ),
    annual_bill AS (
      SELECT
        *
      FROM
        water.billing_invoices bi
      INNER JOIN
        annual_bill_run abr
        ON abr.billing_batch_id = bi.billing_batch_id
      WHERE
        bi.invoice_account_number = 'E00000022A'
    ),
    correct_annual_bill_licence AS (
      SELECT
        bil.billing_invoice_licence_id
      FROM
        water.billing_invoice_licences bil
      INNER JOIN
        annual_bill ab
        ON ab.billing_invoice_id = bil.billing_invoice_id
      WHERE
        bil.licence_ref = 'SW/050/0008/034'
    ),
    incorrect_annual_bill_licence AS (
      SELECT
        bil.billing_invoice_licence_id
      FROM
        water.billing_invoice_licences bil
      INNER JOIN
        annual_bill ab
        ON ab.billing_invoice_id = bil.billing_invoice_id
      WHERE
        bil.licence_ref = 'SW/050/008/034'
    )
    UPDATE water.billing_transactions bt
    SET
      billing_invoice_licence_id = (
        SELECT billing_invoice_licence_id FROM correct_annual_bill_licence
        ),
      date_updated = NOW()
    WHERE
      bt.billing_invoice_licence_id = (
        SELECT billing_invoice_licence_id FROM incorrect_annual_bill_licence
      );

    -- With the transactions moved we can now safely DELETE SW/050/008/034's BIL record
    WITH annual_bill_run AS (
      SELECT
        bb.billing_batch_id
      FROM
        water.billing_batches bb
      WHERE
        bb.batch_type = 'annual'
        AND bb.to_financial_year_ending = 2025
        AND bb.region_id = (
          SELECT
            r.region_id
          FROM
            water.regions r
          WHERE
            r.nald_region_id = 5
        )
    ),
    annual_bill AS (
      SELECT
        *
      FROM
        water.billing_invoices bi
      INNER JOIN
        annual_bill_run abr
        ON abr.billing_batch_id = bi.billing_batch_id
      WHERE
        bi.invoice_account_number = 'E00000022A'
    ),
    incorrect_annual_bill_licence AS (
      SELECT
        bil.billing_invoice_licence_id
      FROM
        water.billing_invoice_licences bil
      INNER JOIN
        annual_bill ab
        ON ab.billing_invoice_id = bil.billing_invoice_id
      WHERE
        bil.licence_ref = 'SW/050/008/034'
    )
    DELETE FROM water.billing_invoice_licences bil
    WHERE
      bil.billing_invoice_licence_id = (
        SELECT
          billing_invoice_licence_id
        FROM
          incorrect_annual_bill_licence
      );

    -- Transactions have a link to the charge element they are based on. The overnight clean will delete SW/050/008/034
    -- and its charge versions once it is no longer linked to any bills, so we don't want to leave any transactions
    -- linked to deleted charge elements. There is no risk with this change, as the charge elements are identical across
    -- the two licences, so there are no discrepancies between the transaction and the charge element details.
    UPDATE water.billing_transactions bt
    SET
      charge_element_id = (
        SELECT
          ce.charge_element_id
        FROM
          water.charge_elements ce
        INNER JOIN
          water.charge_versions cv
          ON cv.charge_version_id = ce.charge_version_id
        WHERE
          cv.licence_ref = 'SW/050/0008/034'
          AND cv.version_number = '1'
      ),
      date_updated = NOW()
    WHERE
      bt.charge_element_id = (
        SELECT
          ce.charge_element_id
        FROM
          water.charge_elements ce
        INNER JOIN
          water.charge_versions cv
          ON cv.charge_version_id = ce.charge_version_id
        WHERE
          cv.licence_ref = 'SW/050/008/034'
          AND cv.version_number = '1'
      );

    -- The rest of the water.billing_invoice_licences (BIL) records have distinct billing_invoice_ids, which means we
    -- can safely update the licence_ref and licence_id to point to SW/050/0008/034 without causing conflicts.
    UPDATE water.billing_invoice_licences bil
    SET
      licence_ref = 'SW/050/0008/034',
      licence_id = (
        SELECT
          l.licence_id
        FROM
          water.licences l
        WHERE
          l.licence_ref = 'SW/050/0008/034'
      )
    WHERE
      bil.licence_ref = 'SW/050/008/034';
  END IF;
END
$$;
