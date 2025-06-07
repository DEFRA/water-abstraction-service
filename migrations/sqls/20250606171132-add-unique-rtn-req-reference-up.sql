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

-- 2. Create a new sequence that will be used to generate new references. We initialise it to the highest `legacy_id`.
DO $$
DECLARE max_legacy_id INTEGER;
BEGIN
  SELECT MAX(legacy_id) INTO max_legacy_id FROM water.return_requirements;
  EXECUTE format('CREATE SEQUENCE return_reference_seq START %s;', max_legacy_id + 1);
END
$$;

COMMIT;
