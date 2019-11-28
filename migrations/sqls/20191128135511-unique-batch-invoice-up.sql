/* Replace with your SQL commands */
alter table water.billing_invoices
	add constraint unique_batch_invoice unique(invoice_account_id, billing_batch_id);