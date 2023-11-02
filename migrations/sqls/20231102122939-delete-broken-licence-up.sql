/* This query is deleting a bad licence data that has a carriage return at the end of it */

DELETE FROM crm_v2.document_roles dr WHERE dr.document_id IN (
  SELECT document_id FROM crm_v2.documents d WHERE d.document_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
);

DELETE FROM crm_v2.documents d WHERE d.document_ref LIKE 'NW/072/0417/002/R01' || CHR(13);

DELETE FROM crm.document_header dh WHERE dh.system_external_id LIKE 'NW/072/0417/002/R01' || CHR(13);

DELETE FROM permit.licence l WHERE l.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);

DELETE FROM "returns"."returns" r  WHERE r.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);


DELETE FROM water.licence_version_purpose_conditions lvpc WHERE lvpc.licence_version_purpose_id IN (
  SELECT lvp.licence_version_purpose_id FROM water.licence_version_purposes lvp WHERE lvp.licence_version_id IN (
    SELECT lv.licence_version_id FROM water.licence_versions lv WHERE lv.licence_id IN (
      SELECT licence_id FROM water.licences l WHERE l.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
    )
  )
);

DELETE FROM water.licence_version_purposes lvp WHERE lvp.licence_version_id IN (
  SELECT lv.licence_version_id FROM water.licence_versions lv WHERE lv.licence_id IN (
    SELECT licence_id FROM water.licences l WHERE l.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
  )
);

DELETE FROM water.licence_versions lv WHERE lv.licence_id IN (
  SELECT licence_id FROM water.licences l WHERE l.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
)

DELETE FROM water.return_requirement_purposes rrp WHERE rrp.return_requirement_id IN (
  SELECT rr.return_requirement_id  FROM water.return_requirements rr WHERE rr.return_version_id IN (
    SELECT rv.return_version_id FROM water.return_versions rv WHERE rv.licence_id IN (
      SELECT licence_id FROM water.licences l WHERE l.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
    )
  )
);

DELETE FROM water.return_requirements rr WHERE rr.return_version_id IN (
  SELECT return_version_id FROM water.return_versions rv WHERE rv.licence_id IN(
    SELECT licence_id FROM water.licences l WHERE l.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
  )
);

DELETE FROM water.return_versions rv WHERE rv.licence_id IN (
  SELECT licence_id FROM water.licences l WHERE l.licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
);

DELETE FROM water.licences l WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);
