ALTER TYPE water.batch_status
  RENAME to batch_status_old;

CREATE TYPE water.batch_status AS ENUM (
	'processing',
	'review',
	'ready',
	'error',
	'sent',
	'empty',
	'cancel',
	'sending'
);

ALTER TABLE water.billing_batches
  ALTER COLUMN status TYPE water.batch_status USING status::text::water.batch_status;

ALTER TABLE water.billing_batch_charge_version_years
  ALTER COLUMN status TYPE water.batch_status USING status::text::water.batch_status;

DROP TYPE water.batch_status_old;
