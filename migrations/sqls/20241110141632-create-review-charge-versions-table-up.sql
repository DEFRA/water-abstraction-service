/*
  Add review_charge_references table

  https://eaflood.atlassian.net/browse/WATER-4188

  Supports the two-part tariff match & allocation engine. It holds details of the charge versions to be included in
  the two-part tariff bill run including their calculated charge period for the bill run in-flight.
*/
BEGIN;

CREATE TABLE water.review_charge_versions (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	review_licence_id uuid NOT NULL,
	charge_version_id uuid NOT NULL,
	change_reason varchar(255) NOT NULL,
	charge_period_start_date date NOT NULL,
	charge_period_end_date date NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO water.review_charge_versions (
  id,
	review_licence_id,
	charge_version_id,
	change_reason,
	charge_period_start_date,
	charge_period_end_date,
	created_at,
	updated_at
)
SELECT
  id,
	review_licence_id,
	charge_version_id,
	change_reason,
	charge_period_start_date,
	charge_period_end_date,
	created_at,
	updated_at
FROM
  public.review_charge_versions;

COMMIT;
