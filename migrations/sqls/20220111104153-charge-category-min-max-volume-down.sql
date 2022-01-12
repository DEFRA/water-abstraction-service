ALTER TABLE water.billing_charge_categories
drop column min_volume,
drop column max_volume;

ALTER TABLE water.billing_charge_categories
add column min_volume integer null,
add column max_volume integer null;