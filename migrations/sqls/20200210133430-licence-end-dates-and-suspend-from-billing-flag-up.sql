/* Replace with your SQL commands */
alter table water.licences
  add column start_date date,
  add column expired_date date default null,
  add column lapsed_date date default null,
  add column revoked_date date default null,
  add column suspend_from_billing boolean not null default false;

