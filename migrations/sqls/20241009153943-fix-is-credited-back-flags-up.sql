/*
  https://eaflood.atlassian.net/browse/WATER-4689

  Our Billing & Data users reported that presroc supplementary bill runs had been miscalculated for three licences. In
  all cases, a previous transaction was expected to be credited in the bill run but wasn't.

  This meant the bills created were debiting the customers more than expected.

  > The reason for the supplementary was either the licence being transferred or ended

  When we dug into what was happening, we found that the transactions we were expecting to be included and reversed were
  not being selected by the `findHistoryByBatchId()` SQL query.

  ```SQL
  -- Key extract from the src/lib/connectors/repos/queries/billing-transactions.js - findHistoryByBatchId

    select t.*, il.licence_id, il.licence_ref, i.invoice_account_number, i.invoice_account_id, i.financial_year_ending,
    b.billing_batch_id, b.is_summer, i.rebilling_state
    from water.billing_transactions t
    join water.billing_invoice_licences il on t.billing_invoice_licence_id=il.billing_invoice_licence_id
    join water.billing_invoices i on il.billing_invoice_id=i.billing_invoice_id
    join water.billing_batches b on i.billing_batch_id=b.billing_batch_id
    where
      b.billing_batch_id<>:batchId
      and t.is_credited_back = false
      and t.source_transaction_id is null
      and b.status='sent'
  ```

  The missing historic transactions all had their `is_credited_back` set to `true`, so the query excluded them.

  It looks like the legacy PRESROC billing engine reverses a historic transaction as a credit and records the ID of the
  historic debit transaction against the new credit. When the bill run is 'sent,' it then sets `is_credited_back` to
  true on the historic debit.

  That is when it works! We have found

  - transactions with `is_credited_back` set to true, even though their IDs do not appear in any `source_transaction_id`
  - transactions with a populated `source_transaction_id`, but the source transaction does not have its
    `is_credited_back` flag set to true

  We also found a previous data fix, WATER-3572, for these flags caused by errored bill runs (note — this is only a data
  fix. There is no reference to trying to make this more resilient 😩).

  This appears to be an ongoing issue. In line with our policy of simple fixes or else migration, we'll have to wait
  until we have an opportunity to replace the PRESROC billing engine.

  Till then, this migration runs a query to fix the first issue. It sets to false `is_credited_back` on transactions
  that don't appear in `source_transaction_id`
 */

-- Set false any transactions flagged as `is_credited_back` that do not appear in `source_transaction_id`
UPDATE water.billing_transactions SET is_credited_back = FALSE
WHERE
  billing_transaction_id IN (
    SELECT
      bt.billing_transaction_id
    FROM
      water.billing_transactions bt
    LEFT JOIN
      water.billing_transactions bt2
      ON bt.billing_transaction_id = bt2.source_transaction_id
    WHERE
      bt.is_credited_back = TRUE
      AND bt2.source_transaction_id IS NULL
  );
