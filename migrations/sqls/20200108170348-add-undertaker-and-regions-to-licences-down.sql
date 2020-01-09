alter table water.licences
  drop column is_water_undertaker,
  drop column regions,
  drop column date_created,
  drop column date_updated,
  drop constraint c_licences_lic_ref_region;
