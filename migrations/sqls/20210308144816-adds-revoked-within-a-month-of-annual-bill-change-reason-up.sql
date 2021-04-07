alter table water.change_reasons
  drop column position;

insert into water.change_reasons 
(description, date_created, triggers_minimum_charge, type, is_enabled_for_new_charge_versions)
values ('Licence revoked within a month of annual billing', NOW(), false, 'new_non_chargeable_charge_version', true);