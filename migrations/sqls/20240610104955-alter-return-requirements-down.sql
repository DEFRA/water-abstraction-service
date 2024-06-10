/* revert changes made */

BEGIN;

ALTER TABLE water.return_requirements DROP COLUMN reporting_frequency;

COMMIT;
