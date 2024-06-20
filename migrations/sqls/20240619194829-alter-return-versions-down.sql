/* revert changes made */

BEGIN;

ALTER TABLE water.return_versions DROP COLUMN created_by;

COMMIT;
