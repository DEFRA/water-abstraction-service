/* drop the unused charge_agreements table */
drop table water.charge_agreements;

/* make the charge versions external_id field a string containing nald regionCode:id */
alter table water.charge_versions 
  alter column external_id type varchar;

update water.charge_versions
  set external_id = concat_ws(':', region_code, external_id, version_number) where source='nald';

alter table water.charge_versions
  add constraint uniq_charge_version_external_id unique(external_id);

/* make the charge elements external_id field a string containing nald regionCode:id */
alter table water.charge_elements 
  alter column external_id type varchar;

update water.charge_elements ce
  set external_id=sub.new_external_id
  from (
    select ce.charge_element_id, concat_ws(':', cv.region_code, ce.external_id) as new_external_id
    from water.charge_elements ce
    join water.charge_versions cv on ce.charge_version_id=cv.charge_version_id
    where cv.source='nald'
  ) as sub 
  where ce.charge_element_id=sub.charge_element_id;

alter table water.charge_elements
  add constraint uniq_charge_element_external_id unique(external_id);
