/* Revert changes made. */
BEGIN;

ALTER TABLE IF EXISTS water.notes ALTER COLUMN type_id SET NOT NULL;
ALTER TABLE IF EXISTS water.notes ALTER COLUMN "type" DROP default;

COMMIT;
