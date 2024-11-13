/* Revert previous change */

BEGIN;

DROP TABLE IF EXISTS water.review_charge_versions;

COMMIT;
