/* Replace with your SQL commands */
ALTER TABLE water.billing_invoice_licences
  ADD COLUMN licence_holder_name JSONB NOT NULL,
  ADD COLUMN licence_holder_address JSONB NOT NULL,
  DROP COLUMN licence_holders;