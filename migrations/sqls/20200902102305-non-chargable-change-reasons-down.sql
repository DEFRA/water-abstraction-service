delete from water.change_reasons
where type = 'new_non_chargeable_charge_version'::water.change_reason_type;

alter table water.change_reasons
  drop column type;

drop type water.change_reason_type;
