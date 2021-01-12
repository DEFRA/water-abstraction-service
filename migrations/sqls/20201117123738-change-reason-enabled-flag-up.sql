/* Replace with your SQL commands */
alter table water.change_reasons
  add column is_enabled_for_new_charge_versions boolean;

update water.change_reasons 
set is_enabled_for_new_charge_versions=sub.is_enabled_for_new_charge_versions
from 
(
  select change_reason_id, description,
  case
    when description='NALD gap' then false
    else true
  end as is_enabled_for_new_charge_versions
  from water.change_reasons
) sub
where change_reasons.change_reason_id=sub.change_reason_id;

alter table water.change_reasons
  alter column is_enabled_for_new_charge_versions set not null;
