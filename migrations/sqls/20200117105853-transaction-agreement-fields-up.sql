/* Replace with your SQL commands */
alter table water.billing_transactions 
  add column section_126_factor numeric not null default 1;

alter table water.billing_transactions 
  add column section_127_agreement boolean not null default false;

alter table water.billing_transactions 
  add column section_130_agreement char(5) default null;