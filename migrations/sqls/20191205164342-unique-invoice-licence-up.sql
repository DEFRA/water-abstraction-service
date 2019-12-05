
alter table water.billing_invoice_licences
	add constraint unique_batch_invoice_licence unique(billing_invoice_id, company_id, address_id, contact_id, licence_id);