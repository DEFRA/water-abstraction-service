/* Replace with your SQL commands */
ALTER TABLE water.billing_transactions ADD CONSTRAINT billing_transactions_billing_invoice_licence_id_fkey FOREIGN KEY (billing_invoice_licence_id) REFERENCES water.billing_invoice_licences(billing_invoice_licence_id);
