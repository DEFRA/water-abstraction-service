/* This query is deleting a bad licence data that has a carriage return at the end of it */

DELETE FROM "crm_v2"."document_roles" WHERE document_id IN (
  SELECT document_id FROM "crm_v2"."documents" WHERE document_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
);

DELETE FROM "crm_v2"."documents" WHERE document_ref LIKE 'NW/072/0417/002/R01' || CHR(13);

DELETE FROM crm.document_header WHERE system_external_id LIKE 'NW/072/0417/002/R01' || CHR(13);

DELETE FROM permit.licence WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);

DELETE FROM "returns"."returns" WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);


DELETE FROM water.licence_version_purpose_conditions WHERE licence_version_purpose_id IN (
  SELECT licence_version_purpose_id FROM water.licence_version_purposes WHERE licence_version_id IN (
    SELECT licence_version_id FROM water.licence_versions WHERE licence_id IN (
      SELECT licence_id FROM water.licences WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
    )
  )
);

DELETE FROM water.licence_version_purposes WHERE licence_version_id IN (
  SELECT licence_version_id FROM water.licence_versions WHERE licence_id IN (
    SELECT licence_id FROM water.licences WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
  )
);

DELETE FROM water.licence_versions WHERE licence_id IN (
  SELECT licence_id FROM water.licences WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
);

DELETE FROM water.return_requirement_purposes WHERE return_requirement_id IN (
  SELECT return_requirement_id  FROM water.return_requirements WHERE return_version_id IN (
    SELECT return_version_id FROM water.return_versions WHERE licence_id IN (
      SELECT licence_id FROM water.licences WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
    )
  )
);

DELETE FROM water.return_requirements WHERE return_version_id IN (
  SELECT return_version_id FROM water.return_versions WHERE licence_id IN(
    SELECT licence_id FROM water.licences WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
  )
);

DELETE FROM water.return_versions WHERE licence_id IN (
  SELECT licence_id FROM water.licences WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
);

DELETE FROM water.licences WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);
