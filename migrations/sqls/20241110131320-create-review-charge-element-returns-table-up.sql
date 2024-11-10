/*
  Add review_charge_element_returns table

  https://eaflood.atlassian.net/browse/WATER-4188

  Supports the two-part tariff match & allocation engine. It holds details of the returns matched to a charge element by
  linking `review_charge_elements` to `review_returns` via this table.
*/
BEGIN;

CREATE TABLE water.review_charge_element_returns (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	review_charge_element_id uuid NOT NULL,
	review_return_id uuid NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO water.review_charge_element_returns (
  id,
  review_charge_element_id,
  review_return_id,
  created_at,
  updated_at
)
SELECT
  id,
  review_charge_element_id,
  review_return_id,
  created_at,
  updated_at
FROM
  public.review_charge_elements_returns;

COMMIT;
