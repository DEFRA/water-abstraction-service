DO $$
  DECLARE max_legacy_id INTEGER;
  BEGIN
    SELECT MAX(legacy_id) INTO max_legacy_id FROM water.return_requirements;
    EXECUTE format('CREATE SEQUENCE return_reference_seq START %s', max_legacy_id + 1);
  END;
$$;
