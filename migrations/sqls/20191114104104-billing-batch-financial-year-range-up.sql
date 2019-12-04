alter table water.billing_batches
  add column start_financial_year integer,
  add column end_financial_year integer;

update water.billing_batches as b
set
  end_financial_year = b.financial_year,
  start_financial_year =
    case
      when b.batch_type = 'supplementary' then b.financial_year - 6
      else b.financial_year
    end;

alter table water.billing_batches
  alter column start_financial_year set not null,
  alter column end_financial_year set not null,
  drop column financial_year;
