ALTER TABLE water.financial_agreement_types
ADD CONSTRAINT code_is_unique UNIQUE (financial_agreement_code);
