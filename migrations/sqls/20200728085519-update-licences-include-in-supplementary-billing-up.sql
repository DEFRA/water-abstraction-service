create type water.include_in_supplementary_billing as enum ('yes', 'no', 'reprocess');

alter table water.licences
  add column include_in_supplementary_billing_temp water.include_in_supplementary_billing;

update water.licences
set include_in_supplementary_billing_temp =
  case
    when include_in_supplementary_billing = true then 'yes'::water.include_in_supplementary_billing
    else 'no'::water.include_in_supplementary_billing
  end;

alter table water.licences
  drop column include_in_supplementary_billing;

alter table water.licences
  rename column include_in_supplementary_billing_temp to include_in_supplementary_billing;

alter table water.licences
  alter column include_in_supplementary_billing set not null;
