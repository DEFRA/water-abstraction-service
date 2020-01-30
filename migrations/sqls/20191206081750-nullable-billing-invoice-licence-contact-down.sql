/* Replace with your SQL commands */
alter table water.billing_invoice_licences
  alter column contact_id set not null;

alter table water.billing_invoice_licences
	drop constraint unique_batch_invoice_licence_no_contact;