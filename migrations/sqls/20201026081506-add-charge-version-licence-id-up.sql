/* Add the licence id to charge versions */
ALTER TABLE water.charge_versions
  ADD COLUMN IF NOT EXISTS "licence_id" uuid;

/* Update the charge version licence id using the licence ref*/
UPDATE water.charge_versions AS cv 
 SET licence_id = l.licence_id
 FROM water.licences AS l
 WHERE l.licence_ref = cv.licence_ref;
