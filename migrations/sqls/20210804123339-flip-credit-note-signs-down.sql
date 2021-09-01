/* Replace with your SQL commands */
UPDATE water.billing_transactions bt set net_amount = ABS(bt.net_amount)
WHERE bt.is_credit is true and bt.billing_transaction_id in (
select billing_transaction_id from water.billing_transactions bt
JOIN water.billing_invoice_licences bil ON bil.billing_invoice_licence_id = bt.billing_invoice_licence_id
join water.billing_invoices bi on bi.billing_invoice_id = bil.billing_invoice_id
join water.billing_batches bb on bb.billing_batch_id = bi.billing_batch_id
where bb.source = 'wrls')
