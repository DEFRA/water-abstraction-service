ALTER TABLE IF EXISTS water.charge_purposes
    ALTER COLUMN purpose_primary_id SET NOT NULL;

ALTER TABLE IF EXISTS water.charge_purposes
    ALTER COLUMN purpose_secondary_id SET NOT NULL;
