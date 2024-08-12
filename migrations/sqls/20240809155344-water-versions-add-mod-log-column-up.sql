/*
  Adds a column to allow us to record imported mod log info

  Mod log is the record in NALD why a charge, licence or return version was added. By importing the information for
  historic charge and return versions, and licences till we switch from NALD, we can build this information into
  new pages that display the changes made to a licence over time.
*/

BEGIN;

ALTER TABLE water.charge_versions ADD mod_log JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE water.return_versions ADD mod_log JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE water.licence_versions ADD mod_log JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
