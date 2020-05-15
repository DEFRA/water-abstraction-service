create table water.billing_volumes (
  billing_volume_id uuid primary key default public.gen_random_uuid(),
  charge_element_id uuid not null
    constraint billing_volumes_charge_element_id_fkey
    references water.charge_elements (charge_element_id),
  financial_year smallint not null,
  is_summer boolean not null,
  calculated_volume numeric,
  two_part_tariff_error boolean not null default false,
  two_part_tariff_status integer,
  two_part_tariff_review jsonb,
  is_approved boolean not null default false,
  constraint uniq_charge_element_id_financial_year unique (charge_element_id, financial_year)
);

alter table water.billing_transactions
  drop column calculated_volume,
  drop column two_part_tariff_error,
  drop column two_part_tariff_status,
  drop column two_part_tariff_review;
