DO $$
  DECLARE max_legacy_id INTEGER;
  BEGIN
    SELECT MAX(legacy_id) INTO max_legacy_id FROM water.return_requirements;
    EXECUTE format('CREATE SEQUENCE water.return_reference_seq START WITH %s INCREMENT BY 1;', max_legacy_id + 1);
  END;
$$;
