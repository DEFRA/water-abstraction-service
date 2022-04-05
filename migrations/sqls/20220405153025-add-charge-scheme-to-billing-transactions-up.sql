alter table water.billing_transactions
    add column scheme water.charge_scheme not null default 'alcs';