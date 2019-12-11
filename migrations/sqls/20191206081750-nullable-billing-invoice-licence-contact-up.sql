/* Replace with your SQL commands */
alter table water.billing_invoice_licences
  alter column contact_id drop not null;
  
alter table water.billing_invoice_licences
	add constraint unique_batch_invoice_licence_no_contact unique(billing_invoice_id, company_id, address_id, licence_id);