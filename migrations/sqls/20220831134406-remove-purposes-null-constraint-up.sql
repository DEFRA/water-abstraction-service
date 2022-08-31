ALTER TABLE IF EXISTS water.charge_purposes
    ALTER COLUMN purpose_primary_id DROP NOT NULL;

ALTER TABLE IF EXISTS water.charge_purposes
    ALTER COLUMN purpose_secondary_id DROP NOT NULL;
