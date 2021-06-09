/* Replace with your SQL commands */

alter table water.financial_agreement_types
  drop constraint if exists uniq_financial_agreement_code;

alter table water.financial_agreement_types
  add constraint uniq_financial_agreement_code unique(financial_agreement_code);
