/*
  Add review_charge_references table

  https://eaflood.atlassian.net/browse/WATER-4378

  Supports the two-part tariff match & allocation engine. It holds details of the two-part tariff return logs found for
  a two-part tariff bill run. We store a lot of details from the return log here, to save having to keep extracting
  information from the metadata JSONB field of the source return log.
*/
BEGIN;

CREATE TABLE water.review_returns (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	review_licence_id uuid NOT NULL,
	return_id varchar(255) NOT NULL,
	return_reference varchar(255) NULL,
	quantity numeric DEFAULT '0'::numeric NULL,
	allocated numeric DEFAULT '0'::numeric NULL,
	under_query bool DEFAULT false NULL,
	return_status varchar(255) NULL,
	nil_return bool DEFAULT false NULL,
	abstraction_outside_period bool DEFAULT false NULL,
	received_date date NULL,
	due_date date NULL,
	purposes jsonb NULL,
	description varchar(255) NULL,
	start_date date NULL,
	end_date date NULL,
	issues text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DO $$
  BEGIN
    IF EXISTS
      (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_returns')
    THEN
      INSERT INTO water.review_returns (
        id,
        review_licence_id,
        return_id,
        return_reference,
        quantity,
        allocated,
        under_query,
        return_status,
        nil_return,
        abstraction_outside_period,
        received_date,
        due_date,
        purposes,
        description,
        start_date,
        end_date,
        issues,
        created_at,
        updated_at
      )
      SELECT
        id,
        review_licence_id,
        return_id,
        return_reference,
        quantity,
        allocated,
        under_query,
        return_status,
        nil_return,
        abstraction_outside_period,
        received_date,
        due_date,
        purposes,
        description,
        start_date,
        end_date,
        issues,
        created_at,
        updated_at
      FROM
        public.review_returns;
    END IF;
  END
$$;



COMMIT;
