alter table water.billing_transactions
    add column scheme water.charge_scheme not null default 'alcs',
    add column aggregate_factor numeric null,
    add column adjustment_factor numeric null,
    add column charge_category_code text null,
    add column charge_category_description text null,
    add column is_supported_source boolean default false,
    add column supported_source_name text null,
    add column winter_discount_factor numeric null,
    add column is_water_company_charge boolean default false,
    add column is_winter_only boolean default false,
    add column is_water_undertaker boolean default false,
    drop constraint season_check,
    alter column season drop not null;
    