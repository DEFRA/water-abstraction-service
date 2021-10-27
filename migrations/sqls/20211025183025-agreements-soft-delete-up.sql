ALTER TABLE water.licence_agreements
  DROP CONSTRAINT uniq_licence_ref_start_date_financial_agreement_type_id;

ALTER TABLE water.licence_agreements
ADD COLUMN date_deleted TIMESTAMP NULL;

CREATE UNIQUE INDEX uniq_licence_ref_start_date_financial_agreement_type_id 
ON water.licence_agreements (licence_ref, start_date, financial_agreement_type_id)
WHERE date_deleted is null;