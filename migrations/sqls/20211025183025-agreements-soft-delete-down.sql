DROP INDEX uniq_licence_ref_start_date_financial_agreement_type_id;

ALTER TABLE water.licence_agreements
DROP COLUMN date_deleted;

ALTER TABLE water.licence_agreements
ADD CONSTRAINT uniq_licence_ref_start_date_financial_agreement_type_id 
UNIQUE("licence_ref", "start_date", "financial_agreement_type_id");
