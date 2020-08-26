
alter table water.licences
  add column include_in_supplementary_billing_temp boolean;

update water.licences
set include_in_supplementary_billing_temp =
  case
    when include_in_supplementary_billing = 'yes'::water.include_in_supplementary_billing then true
    else false
  end;

alter table water.licences
  drop column include_in_supplementary_billing;

alter table water.licences
  rename column include_in_supplementary_billing_temp to include_in_supplementary_billing;

alter table water.licences
  alter column include_in_supplementary_billing set not null;

drop type water.include_in_supplementary_billing;
