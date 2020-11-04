ALTER TABLE water.billing_invoice_licences DROP CONSTRAINT billing_invoice_licences_unique;
ALTER TABLE water.billing_invoice_licences ADD COLUMN company_id uuid not null;
ALTER TABLE water.billing_invoice_licences ADD COLUMN contact_id uuid not null;
ALTER TABLE water.billing_invoice_licences ADD COLUMN address_id uuid not null;
ALTER TABLE water.billing_invoice_licences ADD COLUMN licence_holder_name jsonb not null;
ALTER TABLE water.billing_invoice_licences ADD COLUMN licence_holder_address jsonb not null;
ALTER TABLE water.billing_invoice_licences ADD CONSTRAINT unique_batch_invoice_licence UNIQUE (billing_invoice_id, company_id, address_id, contact_id, licence_id);
