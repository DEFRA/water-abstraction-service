ALTER TABLE water.billing_charge_categories
add column is_tidal boolean default false,
add column loss_factor varchar null,
add column model_tier varchar default null,
add column restricted_source boolean default false;