insert into water.change_reasons
(description, date_created, triggers_minimum_charge, type, is_enabled_for_new_charge_versions)
values ('Strategic review of charges (SRoC)', NOW(), false, 'new_chargeable_charge_version', true);
