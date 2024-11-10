/*
  Add review_charge_references table

  https://eaflood.atlassian.net/browse/WATER-4188

  Supports the two-part tariff match & allocation engine. It holds details of the licences to be included in
  the two-part tariff bill run including their status and any issues found.
*/
BEGIN;

CREATE TABLE water.review_licences (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	bill_run_id uuid NOT NULL,
	licence_id uuid NOT NULL,
	licence_ref varchar(255) NOT NULL,
	licence_holder varchar(255) NOT NULL,
	issues text NULL,
	status varchar(255) NOT NULL,
	progress bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO water.review_licences (
  id,
	bill_run_id,
	licence_id,
	licence_ref,
	licence_holder,
	issues,
	status,
	progress,
	created_at,
	updated_at
)
SELECT
  id,
	bill_run_id,
	licence_id,
	licence_ref,
	licence_holder,
	issues,
	status,
	progress,
	created_at,
	updated_at
FROM
  public.review_licences;

COMMIT;
