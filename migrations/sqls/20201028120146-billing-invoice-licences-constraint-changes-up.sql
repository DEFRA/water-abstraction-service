ALTER TABLE water.billing_invoice_licences DROP CONSTRAINT IF EXISTS unique_batch_invoice_licence;
ALTER TABLE water.billing_invoice_licences DROP COLUMN company_id;
ALTER TABLE water.billing_invoice_licences DROP COLUMN contact_id;
ALTER TABLE water.billing_invoice_licences DROP COLUMN address_id;
ALTER TABLE water.billing_invoice_licences DROP COLUMN licence_holder_name;
ALTER TABLE water.billing_invoice_licences DROP COLUMN licence_holder_address;
ALTER TABLE water.billing_invoice_licences ADD CONSTRAINT billing_invoice_licences_unique UNIQUE (billing_invoice_id,licence_id);
