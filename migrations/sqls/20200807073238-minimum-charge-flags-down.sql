alter table water.change_reasons
  drop column triggers_minimum_charge;

alter table water.billing_transactions
  drop column is_new_licence;