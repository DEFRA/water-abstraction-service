/*
  Add review_charge_elements table

  https://eaflood.atlassian.net/browse/WATER-4378

  Supports the two-part tariff match & allocation engine. It holds details of the 2PT charge elements to be included
  in the two-part tariff bill run, their status, issues and any amendments made to their allocation.
*/
BEGIN;

CREATE TABLE water.review_charge_elements (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	review_charge_reference_id uuid NOT NULL,
	charge_element_id uuid NOT NULL,
	allocated numeric DEFAULT '0'::numeric NULL,
	amended_allocated numeric DEFAULT '0'::numeric NULL,
	charge_dates_overlap bool DEFAULT false NULL,
	issues text NULL,
	status varchar(255) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO water.review_charge_elements (
  id,
  review_charge_reference_id,
  charge_element_id,
  allocated,
  amended_allocated,
  charge_dates_overlap,
  issues,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  review_charge_reference_id,
  charge_element_id,
  allocated,
  amended_allocated,
  charge_dates_overlap,
  issues,
  status,
  created_at,
  updated_at
FROM
  public.review_charge_elements;

COMMIT;
