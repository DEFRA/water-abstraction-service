ALTER TABLE water.billing_batches
ADD COLUMN scheme water.charge_scheme default 'alcs';

UPDATE water.billing_batches set scheme = 'alcs';
