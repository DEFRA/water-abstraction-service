/*
  https://eaflood.atlassian.net/browse/WATER-5160

  When taking over returns management from NALD, we needed to import all the return versions and requirements data.

  However, we didn't spot that NALD has the principle of ‘draft’ return versions, which we don't in WRLS. The reporting
  work stream has spotted 10 errant return versions, which, after investigation, are ‘draft’ NALD return versions.

  So we need to delete draft return versions and any associated child records. We use the status and licence_ref to
  identify the correct return version as the supplied return version ids differ depending on the environment.
*/
BEGIN;

  -- Delete just the draft return version as no child data exists
  DELETE FROM water.return_versions
  WHERE status = 'draft'
  AND licence_id IN (SELECT licence_id FROM water.licences WHERE licence_ref = '16/52/003/G/104');

  -- Delete just the draft return version as no child data exists
  DELETE FROM water.return_versions
  WHERE status = 'draft'
  AND licence_id IN (SELECT licence_id FROM water.licences WHERE licence_ref = '14/45/000/0860');

  -- The draft return version for licence 6/33/09/*G/0003 has child data, so we need to delete this first.
  -- Delete the mod_logs record for the return version
  DELETE FROM water.mod_logs
  WHERE return_version_id IN (
    SELECT rv.return_version_id FROM water.return_versions rv
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '6/33/09/*G/0003'
  );

  -- Delete the return_requirement_points records for the return version
  DELETE FROM water.return_requirement_points
  WHERE return_requirement_id IN (
    SELECT rr.return_requirement_id FROM water.return_requirements rr
    INNER JOIN water.return_versions rv ON rr.return_version_id = rv.return_version_id
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '6/33/09/*G/0003'
  );

  -- Delete the return_requirement_purposes record for the return version
  DELETE FROM water.return_requirement_purposes
  WHERE return_requirement_id IN (
    SELECT rr.return_requirement_id FROM water.return_requirements rr
    INNER JOIN water.return_versions rv ON rr.return_version_id = rv.return_version_id
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '6/33/09/*G/0003'
  );

  -- Delete the return_requirements record for the return version
  DELETE FROM water.return_requirements
  WHERE return_version_id IN (
    SELECT rv.return_version_id FROM water.return_versions rv
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '6/33/09/*G/0003'
  );

  -- Delete the return_versions record for the return version
  DELETE FROM water.return_versions
  WHERE status = 'draft'
  AND licence_id IN (SELECT licence_id FROM water.licences WHERE licence_ref = '6/33/09/*G/0003');

  -- Return version (107) has been created after the draft (106). So we also need to correct the version numbers
  UPDATE water.return_versions SET version_number = 106
  WHERE version_number = 107
  AND licence_id IN (SELECT licence_id FROM water.licences WHERE licence_ref = '6/33/09/*G/0003');

  -- The draft return version for licence 2/26/30/040/R01 has child data, so we need to delete this first.
  -- Delete the mod_logs record for the return version
  DELETE FROM water.mod_logs
  WHERE return_version_id IN (
    SELECT rv.return_version_id FROM water.return_versions rv
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '2/26/30/040/R01'
  );

  -- Delete the return_requirement_purposes record for the return version
  DELETE FROM water.return_requirement_purposes
  WHERE return_requirement_id IN (
    SELECT rr.return_requirement_id FROM water.return_requirements rr
    INNER JOIN water.return_versions rv ON rr.return_version_id = rv.return_version_id
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '2/26/30/040/R01'
  );

  -- Delete the return_requirements record for the return version
  DELETE FROM water.return_requirements
  WHERE return_version_id IN (
    SELECT rv.return_version_id FROM water.return_versions rv
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '2/26/30/040/R01'
  );

  -- Delete the return_versions record for the return version
  DELETE FROM water.return_versions
  WHERE status = 'draft'
  AND licence_id IN (SELECT licence_id FROM water.licences WHERE licence_ref = '2/26/30/040/R01');

  -- The draft return version for licence 28/39/18/0048 has child data, so we need to delete this first.
  -- Delete the mod_logs record for the return version
  DELETE FROM water.mod_logs
  WHERE return_version_id IN (
    SELECT rv.return_version_id FROM water.return_versions rv
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '28/39/18/0048'
  );

  -- Delete the return_requirement_points records for the return version
  DELETE FROM water.return_requirement_points
  WHERE return_requirement_id IN (
    SELECT rr.return_requirement_id FROM water.return_requirements rr
    INNER JOIN water.return_versions rv ON rr.return_version_id = rv.return_version_id
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '28/39/18/0048'
  );

  -- Delete the return_requirement_purposes record for the return version
  DELETE FROM water.return_requirement_purposes
  WHERE return_requirement_id IN (
    SELECT rr.return_requirement_id FROM water.return_requirements rr
    INNER JOIN water.return_versions rv ON rr.return_version_id = rv.return_version_id
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '28/39/18/0048'
  );

  -- Delete the return_requirements record for the return version
  DELETE FROM water.return_requirements
  WHERE return_version_id IN (
    SELECT rv.return_version_id FROM water.return_versions rv
    INNER JOIN water.licences l ON rv.licence_id = l.licence_id
    WHERE rv.status = 'draft'
    AND l.licence_ref = '28/39/18/0048'
  );

  -- Delete the return_versions record for the return version
  DELETE FROM water.return_versions
  WHERE status = 'draft'
  AND licence_id IN (SELECT licence_id FROM water.licences WHERE licence_ref = '28/39/18/0048');

COMMIT;
