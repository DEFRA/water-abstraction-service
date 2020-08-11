/* Replace with your SQL commands */
alter table water.billing_batch_charge_versions drop constraint uniq_batch_charge_version;

alter table water.billing_batch_charge_version_years drop constraint uniq_batch_charge_version_year;