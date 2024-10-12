/*
  https://eaflood.atlassian.net/browse/WATER-4710

  See previous fix migration migrations/sqls/20241009153943-fix-is-credited-back-flags-up.sql for background on why this
  fix is needed.

  Specifically, this migration runs a query to fix transactions with a populated `source_transaction_id`, but the source
  transaction does not have its `is_credited_back` flag set to true.
 */

-- Set true any transactions not flagged as `is_credited_back` but do appear in `source_transaction_id`. This normally
-- is applied when a bill run is 'sent'. So, we limit the fix only to those transactions linked to 'sent' bill runs.
UPDATE water.billing_transactions SET is_credited_back = TRUE
WHERE
  billing_transaction_id IN (
    SELECT
      bt.billing_transaction_id
    FROM
      water.billing_transactions bt
    INNER JOIN
      water.billing_invoice_licences bil
      ON bil.billing_invoice_licence_id  = bt.billing_invoice_licence_id
    INNER JOIN
      water.billing_invoices bi
      ON bi.billing_invoice_id = bil.billing_invoice_id
    INNER JOIN
      water.billing_batches bb
      ON bb.billing_batch_id = bi.billing_batch_id
    WHERE
      bb.status = 'sent'
      AND bt.is_credited_back = FALSE
      AND EXISTS (
        SELECT 1
        FROM
          water.billing_transactions bt2
        WHERE
          bt2.source_transaction_id = bt.billing_transaction_id
          AND bt2.source_transaction_id IS NOT NULL
      )
  );
