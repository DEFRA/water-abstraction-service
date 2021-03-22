UPDATE water.billing_batches SET status = 'processing' where status='generating';
UPDATE water.billing_batch_charge_version_years SET status = 'processing' where status='generating';

ALTER table water.billing_batches ALTER column status TYPE varchar;
ALTER table water.billing_batch_charge_version_years ALTER column status TYPE varchar;

DROP TYPE water.batch_status;

CREATE TYPE water.batch_status AS ENUM (
	'processing',
	'review',
	'ready',
	'error',
	'sent',
	'empty'
);

ALTER table water.billing_batches ALTER column status TYPE water.batch_status USING status::water.batch_status;
ALTER table water.billing_batch_charge_version_years ALTER column status TYPE water.batch_status USING status::water.batch_status;
