/* Replace with your SQL commands */
ALTER TABLE water.billing_invoice_licences
  DROP COLUMN licence_holder_name,
  DROP COLUMN licence_holder_address,
  ADD COLUMN licence_holders JSONB NOT NULL;
