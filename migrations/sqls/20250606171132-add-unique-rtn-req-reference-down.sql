/* revert changes made */

-- 1. Drop the trigger that syncs legacy_id to reference
DROP TRIGGER IF EXISTS trg_sync_legacy_id ON water.return_requirements;

-- 2. Drop the trigger function
DROP FUNCTION IF EXISTS sync_legacy_id_to_reference();

-- 3. Remove the default on the reference column
ALTER TABLE water.return_requirements ALTER COLUMN reference DROP DEFAULT;

-- 4. Drop the unique constraint on reference (if you created it)
ALTER TABLE water.return_requirements DROP CONSTRAINT IF EXISTS return_requirements_reference_unique;

-- 5. Drop the reference column
ALTER TABLE water.return_requirements DROP COLUMN IF EXISTS reference;

-- 6. Drop the sequence
DROP SEQUENCE IF EXISTS return_reference_seq;
