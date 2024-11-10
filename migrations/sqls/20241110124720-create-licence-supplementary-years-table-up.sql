/*
  Add licence_supplementary_years table

  https://eaflood.atlassian.net/browse/WATER-4590

  When a licence is removed from an annual two-part tariff bill run, it must be flagged to be included in the
  supplementary two-part bill run. Currently, on the licence table,
  we have a supplementary bill run flag used for pre-sroc supplementary bill runs. However, with a 2pt sroc one we need
  to be able to store the year that the licence needs to be included.

  The solution is a new table called licence_supplementary_years. This table will contain details of the licenceId,
  billRunId (if its been picked up by a billRun), the financialYearEnd and if it is 2pt. We have the 2pt column to allow
  us in the future to change existing supplementary flagging for non-2pt bill runs.

  The table was originally added to the 'public' schema but we later decided to move it into 'water', Hence there is an
  additional copy query in this migration.
*/
BEGIN;

CREATE TABLE water.licence_supplementary_years (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	licence_id uuid NOT NULL,
	bill_run_id uuid NULL,
	financial_year_end int4 NOT NULL,
	two_part_tariff bool NOT NULL DEFAULT false,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO water.licence_supplementary_years (
  id,
  licence_id,
  bill_run_id,
  financial_year_end,
  two_part_tariff,
  created_at,
  updated_at
)
SELECT
  id,
  licence_id,
  bill_run_id,
  financial_year_end,
  two_part_tariff,
  created_at,
  updated_at
FROM
  public.licence_supplementary_years;

COMMIT;
