/* make sure all licence_ids are populated */
UPDATE water.charge_versions cv
SET licence_id = l.licence_id FROM water.licences l where l.licence_ref = cv.licence_ref;

/* Delete any where licence id is still null */
DELETE FROM water.charge_versions WHERE licence_id IS NULL;

/* set not null constraint on licence id */
ALTER TABLE water.charge_versions
ALTER COLUMN licence_id SET NOT NULL;

/* add foreign key reference to licences */
ALTER TABLE water.charge_versions
ADD CONSTRAINT charge_versions_licence_id_fkey
    FOREIGN KEY(licence_id)
    REFERENCES water.licences (licence_id);
