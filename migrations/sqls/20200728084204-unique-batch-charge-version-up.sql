/* delete duplicates */
delete from
    water.billing_batch_charge_versions a
        using water.billing_batch_charge_versions b
where
    a.billing_batch_charge_version_id < b.billing_batch_charge_version_id
    and a.charge_version_id = b.charge_version_id
    and a.billing_batch_id = b.billing_batch_id;


/* add constraints */
alter table water.billing_batch_charge_versions
  add constraint uniq_batch_charge_version unique(billing_batch_id, charge_version_id);

alter table water.billing_batch_charge_version_years
  add constraint uniq_batch_charge_version_year unique(billing_batch_id, charge_version_id, financial_year_ending);