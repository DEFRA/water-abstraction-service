/* Replace with your SQL commands */

update water.charge_elements 
  set factors_overridden=false 
  where factors_overridden is null;

alter table water.charge_elements 
  alter column factors_overridden set not null;