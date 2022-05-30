alter table water.billing_transactions
drop constraint abstraction_period_check,
drop constraint season_check;

alter table water.billing_transactions
    add column scheme water.charge_scheme not null default 'alcs',
    add column aggregate_factor numeric null,
    add column adjustment_factor numeric null,
    add column charge_category_code text null,
    add column charge_category_description text null,
    add column is_supported_source boolean default false,
    add column supported_source_name text null,
    add column is_water_company_charge boolean default false,
    add column is_winter_only boolean default false,
    add column is_water_undertaker boolean default false,
    add column purposes jsonb null,
    add column winter_discount_factor numeric null,
    alter column season drop not null;

    alter table water.billing_transactions
    add constraint season_check check (
    charge_type='minimum_charge' or season is not null or scheme='sroc'
    ),
    add constraint abstraction_period_check check (
    charge_type='minimum_charge' or abstraction_period is not null or scheme='sroc'
    ),
    add constraint purposes_check check (
    purposes is not null or scheme='alcs'
    );
    