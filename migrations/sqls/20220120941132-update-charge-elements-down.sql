alter table water.charge_elements
    drop constraint "volume_authorised_annual_quantity"
;

alter table water.charge_elements
    add column sroc_category varchar,
    alter column purpose_use_id set not null,
    alter column purpose_secondary_id set not null,
    alter column purpose_primary_id set not null,
    alter column season_derived set not null,
    alter column season set not null,
    alter column authorised_annual_quantity set not null,
    alter column abstraction_period_end_month set not null,
    alter column abstraction_period_end_day set not null,
    alter column abstraction_period_start_day set not null,
    alter column abstraction_period_start_month set not null,
    drop column is_section_130_agreement_enabled,
    drop column is_section_126_agreement_enabled,
    drop column is_winter_discount_enabled,
    drop column adjustments,
    drop column is_public_water_supply,
    drop column additional_charges,
    drop column billing_charge_category_id,
    drop column volume,
    drop column water_model,
    drop column is_restricted_source,
    drop column scheme
;

alter type water.charge_element_source
    rename to charge_element_source_old;

create type water.charge_element_source AS ENUM ('supported', 'unsupported', 'kielder', 'tidal');

alter table water.charge_elements
    alter column source type water.charge_element_source using source::text::water.charge_element_source;

alter table water.billing_transactions
    alter column source type water.charge_element_source using source::text::water.charge_element_source;

alter table water.charge_purposes
    alter column source type water.charge_element_source using source::text::water.charge_element_source;

drop type charge_element_source_old;

drop type if exists water.charge_element_water_model;