DO $$
DECLARE
  max_legacy_id INTEGER;
  restart_value INTEGER;
BEGIN
  -- Get highest legacy_id, default to 0 if no rows exist
  SELECT COALESCE(MAX(legacy_id), 0) INTO max_legacy_id FROM water.return_requirements;

  -- Compute next value for sequence
  restart_value := max_legacy_id + 1;

  -- Create sequence
  CREATE SEQUENCE water.return_reference_seq;

  -- Set sequence to start at next value
  EXECUTE 'ALTER SEQUENCE water.return_reference_seq RESTART WITH ' || restart_value;
END;
$$;
