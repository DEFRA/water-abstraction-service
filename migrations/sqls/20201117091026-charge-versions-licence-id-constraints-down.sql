/* remove foreign key to licences */
ALTER TABLE water.charge_versions DROP CONSTRAINT IF EXISTS charge_versions_licence_id_fkey;
/* remove not null from licence id*/
ALTER TABLE water.charge_versions ALTER COLUMN licence_id DROP NOT NULL;