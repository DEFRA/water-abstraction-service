drop table if exists water.billing_batch_charge_versions;

create type water.charge_version_years_transaction_type as enum ('annual', 'two_part_tariff');

alter table water.billing_batch_charge_version_years
  add column transaction_type varchar,
  add column is_summer boolean;

/* Update constraint to include transaction_type and is_summer */
alter table water.billing_batch_charge_version_years drop constraint if exists uniq_batch_charge_version_year;

/* Update transaction_type and is_summer for annual and TPT batches */
update water.billing_batch_charge_version_years as y 
  set (transaction_type, is_summer) =
  (select b.batch_type, b.is_summer FROM water.billing_batches as b
    where y.billing_batch_id = b.billing_batch_id
    and b.batch_type in ('annual', 'two_part_tariff'));

/* At this point, transaction_type is null for charge version years for supplementary batches */

/* Create charge version years records for TPT transactions in existing supplementary batches */
insert into water.billing_batch_charge_version_years (billing_batch_id, charge_version_id, is_summer, transaction_type, financial_year_ending, status)
select distinct b.billing_batch_id, ce.charge_version_id, t.season='summer' as is_summer, 
'two_part_tariff' as transaction_type,
case
  when date_part('month', t.end_date) >= 4
    then date_part('year', t.end_date)+1
   else date_part('year', t.end_date)
  end as financial_year_ending,
'ready'::water.batch_status as status
from water.billing_transactions t
join water.billing_invoice_licences il on t.billing_invoice_licence_id=il.billing_invoice_licence_id
join water.billing_invoices i on il.billing_invoice_id=i.billing_invoice_id
join water.billing_batches b on i.billing_batch_id=b.billing_batch_id
join water.charge_elements ce on t.charge_element_id=ce.charge_element_id
where b.batch_type='supplementary'
and t.is_two_part_tariff_supplementary=true;


/* Finally, update all rows where transaction_type is null to 'annual' */
update water.billing_batch_charge_version_years 
  set transaction_type =  'annual', 
  is_summer = false
  where transaction_type is null;

alter table water.billing_batch_charge_version_years
  alter column transaction_type type water.charge_version_years_transaction_type 
    using transaction_type::text::water.charge_version_years_transaction_type,
  alter column transaction_type set not null,
  alter column is_summer set not null;

alter table water.billing_batch_charge_version_years
  add constraint uniq_batch_charge_version_year_transaction_type_season unique(billing_batch_id, charge_version_id, financial_year_ending, transaction_type, is_summer);