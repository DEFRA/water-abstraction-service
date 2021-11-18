alter table water.billing_transactions 
drop column is_two_part_tariff_supplementary;

alter table water.billing_transactions 
add column is_two_part_second_part_charge boolean default false not null;

update water.billing_transactions 
set is_two_part_second_part_charge = true
where lower(description) like 'second%';