drop table if exists water.billing_batch_charge_versions;

create type water.charge_version_years_transaction_type as enum ('annual', 'two_part_tariff');

alter table water.billing_batch_charge_version_years
  add column transaction_type varchar,
  add column is_summer boolean;

/* Update constraint to include transaction_type and is_summer */
alter table water.billing_batch_charge_version_years drop constraint uniq_batch_charge_version_year;

/* Update transaction_type and is_summer for annual and TPT batches */
update water.billing_batch_charge_version_years as y 
  set (transaction_type, is_summer) =
  (select b.batch_type, b.is_summer FROM water.billing_batches as b
    where y.billing_batch_id = b.billing_batch_id
    and b.status = 'sent'
    and b.batch_type in ('annual', 'two_part_tariff'));

/* At this point, transaction_type is null for charge version years for supplementary batches */

/* Create charge version years records for TPT transactions in previously run TPT batches 
  NB: This only captures licences which were part of a TPT run, 
      ie not those which were removed during a TPT run */
insert into water.billing_batch_charge_version_years (billing_batch_id, charge_version_id, financial_year_ending, status, transaction_type, is_summer)
  select supp_batch.*, tpt_batch.batch_type, tpt_batch.is_summer
  from (select y.charge_version_id, b.batch_type, b.is_summer 
    from water.billing_batches as b 
    join water.billing_batch_charge_version_years as y on b.billing_batch_id=y.billing_batch_id
    where b.status='sent'
      and b.batch_type='two_part_tariff'
      and y.financial_year_ending >= b.from_financial_year_ending
      and y.financial_year_ending <= b.to_financial_year_ending
    ) as tpt_batch
    join (select y.billing_batch_id, y.charge_version_id, y.financial_year_ending, y.status
      from water.billing_batch_charge_version_years as y
      join water.billing_batches as b on y.billing_batch_id=b.billing_batch_id	
      join water.billing_invoices as i on b.billing_batch_id=i.billing_batch_id 
      join water.billing_invoice_licences as il on i.billing_invoice_id=il.billing_invoice_id 
      join water.billing_transactions as t on il.billing_invoice_licence_id=t.billing_invoice_licence_id
      where y.transaction_type is null
        and t.is_two_part_tariff_supplementary=true
      group by y.billing_batch_id, y.charge_version_id, y.financial_year_ending, y.status
    ) as supp_batch 
  on tpt_batch.charge_version_id=supp_batch.charge_version_id;

/* Create charge version years records for TPT transactions which were not part of a TPT run 
   ie mop up the charge version years which were missed in above query */
insert into water.billing_batch_charge_version_years (billing_batch_id, charge_version_id, financial_year_ending, status, transaction_type, is_summer)
select distinct y.billing_batch_id, y.charge_version_id, y.financial_year_ending, y.status, 'two_part_tariff', v.is_summer 
from water.billing_batch_charge_version_years y
	join water.billing_batches as b on y.billing_batch_id=b.billing_batch_id
	join water.billing_invoices as i on y.billing_batch_id=i.billing_batch_id
	join water.billing_invoice_licences as l on i.billing_invoice_id=l.billing_invoice_id
	join water.billing_transactions as t on l.billing_invoice_licence_id=t.billing_invoice_licence_id
	join water.billing_volumes as v on t.charge_element_id=v.charge_element_id
	where y.transaction_type is null
		and t.is_two_part_tariff_supplementary=true 
		and y.charge_version_id not in (select y.charge_version_id
      from water.billing_batch_charge_version_years as y
      join water.billing_batches as b on y.billing_batch_id=b.billing_batch_id	
      join water.billing_invoices as i on b.billing_batch_id=i.billing_batch_id 
      join water.billing_invoice_licences as il on i.billing_invoice_id=il.billing_invoice_id 
      join water.billing_transactions as t on il.billing_invoice_licence_id=t.billing_invoice_licence_id
      where y.transaction_type='two_part_tariff'
        and t.is_two_part_tariff_supplementary=true
        and b.batch_type='supplementary');


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