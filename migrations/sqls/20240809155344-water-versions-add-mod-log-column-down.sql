/* revert changes made */

BEGIN;

ALTER TABLE water.charge_versions DROP COLUMN mod_log;
ALTER TABLE water.return_versions DROP COLUMN mod_log;
ALTER TABLE water.licence_versions DROP COLUMN mod_log;

COMMIT;
