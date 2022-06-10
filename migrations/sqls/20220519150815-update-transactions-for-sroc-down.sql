alter table water.billing_transactions
drop constraint abstraction_period_check,
drop constraint season_check;

alter table water.billing_transactions
    drop column scheme,
    drop column aggregate_factor,
    drop column adjustment_factor,
    drop column charge_category_code,
    drop column charge_category_description,
    drop column is_supported_source,
    drop column supported_source_name,
    drop column is_water_company_charge,
    drop column is_winter_only,
    drop column is_water_undertaker,
    drop column winter_discount_factor,
    drop column purposes,
    drop column calc_adjustment_factor,
    drop column calc_winter_discount_factor,
    add constraint season_check check (
    charge_type='minimum_charge' or season is not null
    ),
    add constraint abstraction_period_check check (
    charge_type='minimum_charge' or abstraction_period is not null
    );
  