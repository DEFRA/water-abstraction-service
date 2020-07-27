update water.billing_transactions
set description = 'Empty description'
where description is null;

alter table water.billing_transactions
  alter column description set not null;
