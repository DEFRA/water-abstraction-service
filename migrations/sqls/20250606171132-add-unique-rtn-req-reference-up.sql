/*
  https://eaflood.atlassian.net/browse/WATER-5085

  When testing the results of our one-off
  [quarterly return versions for water companies job](https://github.com/DEFRA/water-abstraction-system/pull/1648), the
  users spotted an issue with the return references being generated.

  The way we create return requirement references differs from NALD's approach. NALD now uses unique references, whereas
  we don't. We assumed the ID was based on how the rest of the IDs are generated in NALD: they are unique to the region
  the record is linked to, but you can and will get duplicates across the regions.

  Great, we can ditch our logic and just make `legacy_id` an incrementing ID field, can't we?

  Unfortunately, no. The problem we've is that it appears NALD only began creating unique references from approximately
  2008 onwards. So, about 7K records are using duplicate references that (at this time) we can't just go in and change.

  Therefore, our plan to resolve this issue is to add a new column called `reference` to `water.return_requirements`,
  which will serve as an incrementing ID. As new records are added in the future, we can leave PostgreSQL to determine
  what the next reference should be. But, if it's going to be of use in the future, we'll want this to become the
  'actual' reference and deprecate the `legacy_id` field.

  To do that, we'll want to initialise `reference` for each record to be `legacy_id`. That'll work for most of the
  records. But we'll need to use a different value where a `legacy_id` is duplicated.

  Once we have the column, and all records are populated, the final fix will be to add a trigger, that ensures whatever
  PostgreSQL generates for `reference`, gets copied to `legacy_id`. By doing this, we won't break any existing
  functionality whilst we work on using the new `reference` instead of `legacy_id`.
*/

BEGIN;

-- 1. Add the new column
ALTER TABLE water.return_requirements ADD COLUMN reference INTEGER;

-- 2. Create a new sequence that will be used to generate new references. In an environment with existing data we
-- initialise it to the highest `legacy_id`. In CI where there is no data it falls back to being 1
DO $$
DECLARE
  max_legacy_id INTEGER;
  restart_value INTEGER;
BEGIN
  -- Get highest legacy_id, default to 9999999 if no rows exist. This means the sequence will start at 10000000 in CI.
  SELECT COALESCE(MAX(legacy_id), 9999999) INTO max_legacy_id FROM water.return_requirements;

  -- Compute next value for sequence
  restart_value := max_legacy_id + 1;

  -- Create sequence
  CREATE SEQUENCE water.return_reference_seq;

  -- Set sequence to start at next value
  EXECUTE 'ALTER SEQUENCE water.return_reference_seq RESTART WITH ' || restart_value;
END;
$$;

-- 3. Populate the new column with the existing `legacy_id` value where the ID is unique
WITH unique_legacy_ids AS (
  SELECT legacy_id
  FROM water.return_requirements
  GROUP BY legacy_id
  HAVING COUNT(*) = 1
)
UPDATE water.return_requirements rr
SET reference = rr.legacy_id
FROM unique_legacy_ids u
WHERE rr.legacy_id = u.legacy_id
  AND rr.reference IS NULL;

-- 4. For those that are duplicated, populate 'reference' with the legacy ID of the first record in the duplicate group
WITH ranked_duplicates AS (
  SELECT return_requirement_id
  FROM (
    SELECT
      return_requirement_id,
      ROW_NUMBER() OVER (PARTITION BY legacy_id ORDER BY return_requirement_id) AS rn
    FROM water.return_requirements
    WHERE legacy_id IN (
      SELECT legacy_id
      FROM water.return_requirements
      GROUP BY legacy_id
      HAVING COUNT(*) > 1
    )
  ) sub
  WHERE rn = 1
)
UPDATE water.return_requirements rr
SET reference = legacy_id
FROM ranked_duplicates rd
WHERE rr.return_requirement_id = rd.return_requirement_id
  AND rr.reference IS NULL;

-- 5. Populate the remaining duplicate return requirement records with brand new references using the new sequence
UPDATE water.return_requirements
SET reference = nextval('return_reference_seq')
WHERE reference IS NULL;

-- 6. Now the column is fully populated, default it to the next reference for new records
ALTER TABLE water.return_requirements ALTER COLUMN reference SET DEFAULT nextval('return_reference_seq');

-- 7. Make the column not null
ALTER TABLE water.return_requirements ALTER COLUMN reference SET NOT NULL;

-- 8. Add a unique constraint
ALTER TABLE water.return_requirements ADD CONSTRAINT return_requirements_reference_unique UNIQUE (reference);

-- 9. Create a trigger that will sync legacy_id to reference when a new record is inserted
CREATE OR REPLACE FUNCTION sync_legacy_id_to_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- If legacy_id is NULL, set it to NEW.reference
  IF NEW.legacy_id IS NULL THEN
    NEW.legacy_id := NEW.reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Assign the trigger to fire before each new insert to return_requirements
CREATE TRIGGER trg_sync_legacy_id
BEFORE INSERT ON water.return_requirements
FOR EACH ROW
EXECUTE FUNCTION sync_legacy_id_to_reference();

COMMIT;
