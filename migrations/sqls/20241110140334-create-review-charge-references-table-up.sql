/*
  Add review_charge_references table

  https://eaflood.atlassian.net/browse/WATER-4188

  Supports the two-part tariff match & allocation engine. It holds details of the charge references to be included in
  the two-part tariff bill run including existing adjustments and amendments to them for the bill run in flight.
*/
BEGIN;

CREATE TABLE water.review_charge_references (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	review_charge_version_id uuid NOT NULL,
	charge_reference_id uuid NOT NULL,
	"aggregate" numeric DEFAULT '1'::numeric NOT NULL,
	amended_aggregate numeric DEFAULT '1'::numeric NOT NULL,
	authorised_volume numeric DEFAULT '0'::numeric NOT NULL,
	amended_authorised_volume numeric DEFAULT '0'::numeric NOT NULL,
	charge_adjustment numeric DEFAULT '1'::numeric NOT NULL,
	amended_charge_adjustment numeric DEFAULT '1'::numeric NOT NULL,
	abatement_agreement numeric DEFAULT '1'::numeric NOT NULL,
	winter_discount bool NOT NULL DEFAULT false,
	two_part_tariff_agreement bool NOT NULL DEFAULT false,
	canal_and_river_trust_agreement bool NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DO $$
  BEGIN
    IF EXISTS
      (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_charge_references')
    THEN
			INSERT INTO water.review_charge_references (
				id,
				review_charge_version_id,
				charge_reference_id,
				"aggregate",
				amended_aggregate,
				charge_adjustment,
				amended_charge_adjustment,
				abatement_agreement,
				winter_discount,
				two_part_tariff_agreement,
				canal_and_river_trust_agreement,
				authorised_volume,
				amended_authorised_volume,
				created_at,
				updated_at
			)
			SELECT
				id,
				review_charge_version_id,
				charge_reference_id,
				"aggregate",
				amended_aggregate,
				charge_adjustment,
				amended_charge_adjustment,
				abatement_agreement,
				winter_discount,
				two_part_tariff_agreement,
				canal_and_river_trust_agreement,
				authorised_volume,
				amended_authorised_volume,
				created_at,
				updated_at
			FROM
				public.review_charge_references;
    END IF;
  END
$$;

COMMIT;
