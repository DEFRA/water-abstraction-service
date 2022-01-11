create type water.charge_element_water_model as enum ('no model', 'tier 1', 'tier 2');

alter table water.charge_elements
    add column scheme                           water.charge_scheme              not null default 'alcs',
    add column is_restricted_source             boolean default false,
    add column water_model                      water.charge_element_water_model null,
    add column volume                           numeric,
    add column billing_charge_category_id       uuid                             null,
    add column additional_charges               jsonb                            null,
    add column is_public_water_supply           boolean default false,
    add column adjustments                      jsonb                            null,
    add column is_winter_discount_enabled       boolean default false,
    add column is_section_126_agreement_enabled boolean default false,
    add column is_section_130_agreement_enabled boolean default false,
    alter column abstraction_period_start_day drop not null,
    alter column abstraction_period_start_month drop not null,
    alter column abstraction_period_end_day drop not null,
    alter column abstraction_period_end_month drop not null,
    alter column authorised_annual_quantity drop not null,
    alter column season drop not null,
    alter column season_derived drop not null,
    alter column purpose_primary_id drop not null,
    alter column purpose_secondary_id drop not null,
    alter column purpose_use_id drop not null,
    drop column sroc_category
;

alter table water.charge_elements
    add constraint "volume_authorised_annual_quantity" check (volume is not null or authorised_annual_quantity is not null)
;
