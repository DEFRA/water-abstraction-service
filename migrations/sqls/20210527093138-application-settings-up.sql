/* Replace with your SQL commands */

insert into water.application_state (key, data, date_created)
  values('settings', '{
    "isInvoiceAccountImportEnabled": true, 
    "isLicenceAgreementImportEnabled" : true,
    "isBillingDocumentRoleImportEnabled" : true
    }', now());
