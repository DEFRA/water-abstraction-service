update 
water.billing_transactions bt
set is_credited_back = false
where bt.is_credited_back is true
and bt.billing_transaction_id not in (
select source_transaction_id from water.billing_transactions bt2
join water.billing_invoice_licences bil on bt2.billing_invoice_licence_id = bil.billing_invoice_licence_id 
join water.billing_invoices bi on bi.billing_invoice_id = bil.billing_invoice_id 
join water.billing_batches bb on bb.billing_batch_id = bi.billing_batch_id 
where bb.status = 'sent' and bt2.source_transaction_id is not null);