/* Replace with your SQL commands */
DROP TABLE IF EXISTS water.financial_agreement_types;

/* Replace with your SQL commands */
CREATE TYPE water.charge_agreement_code AS ENUM ('S126', 'S127', 'INST');

ALTER TABLE water.charge_agreements
   ALTER COLUMN agreement_code TYPE water.charge_agreement_code USING agreement_code::water.charge_agreement_code;
