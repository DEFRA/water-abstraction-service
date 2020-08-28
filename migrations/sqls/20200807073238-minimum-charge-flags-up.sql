alter table water.change_reasons
  add column triggers_minimum_charge boolean not null default false;

update water.change_reasons
set triggers_minimum_charge=true
where description in (
  'Succession or transfer of licence',
  'Succession to a remainder licence or licence apportionment',
  'New licence in part succession or licence apportionment',
  'New licence',
  'Licence transferred and now chargeable'
);

alter table water.billing_transactions
  add column is_new_licence boolean not null default false;