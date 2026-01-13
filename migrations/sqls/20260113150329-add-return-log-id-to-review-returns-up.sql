/*
  Adds and populates a new return_log_id UUID field to the table water.review_returns

  https://eaflood.atlassian.net/browse/WATER-5427

  This migration will add a new return_log_id UUID field to the table water.review_returns. It will then populate this
  field with the corresponding id from the returns.returns table based on the return_id foreign key.
*/

BEGIN;
  -- Add the column without NOT NULL constraint first
  ALTER TABLE water.review_returns ADD COLUMN return_log_id UUID;

  -- Populate the column with data from returns table
  DO $$
    BEGIN
      IF EXISTS
        (SELECT 1 FROM information_schema.tables WHERE table_schema = 'returns' AND table_name = 'returns')
      THEN
        UPDATE water.review_returns rr
        SET return_log_id = r.id
        FROM "returns"."returns" r
        WHERE rr.return_id = r.return_id;
      END IF;
    END
  $$;

  -- Now add the NOT NULL constraint after data is populated. All rows should have a valid return_log_id now.
  ALTER TABLE water.review_returns ALTER COLUMN return_log_id SET NOT NULL;
COMMIT;
