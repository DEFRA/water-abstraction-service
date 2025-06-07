BEGIN;

-- 1. Add the new column
ALTER TABLE water.return_requirements ADD COLUMN reference INTEGER;

-- 2. Create a new sequence that will be used to generate new references. We initialise it to the highest `legacy_id`.
DO $$
  DECLARE max_legacy_id INTEGER;
  BEGIN
    SELECT MAX(legacy_id) INTO max_legacy_id FROM water.return_requirements;
    EXECUTE format('CREATE SEQUENCE return_reference_seq START %s', max_legacy_id + 1);
  END;
$$;

COMMIT;
