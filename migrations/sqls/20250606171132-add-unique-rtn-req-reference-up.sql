DO $$
DECLARE
  max_legacy_id INTEGER;
BEGIN
  -- Get the highest legacy_id
  SELECT MAX(legacy_id) INTO max_legacy_id FROM water.return_requirements;

  -- Create the sequence (starts at 1 by default)
  CREATE SEQUENCE water.return_reference_seq;

  -- Restart the sequence at max_legacy_id + 1
  EXECUTE 'ALTER SEQUENCE water.return_reference_seq RESTART WITH ' || (max_legacy_id + 1);
END;
$$;
