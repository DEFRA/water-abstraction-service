/* Replace with your SQL commands */
alter table water.licences
  drop column start_date,
  drop column expired_date,
  drop column lapsed_date,
  drop column revoked_date,
  drop column suspend_from_billing;