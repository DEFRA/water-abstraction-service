/* This query is deleting a bad licence data that has a carriage return at the end of it */
DO $$
    BEGIN
        IF EXISTS
            ( SELECT 1
              FROM   information_schema.tables
              WHERE  table_schema = 'crm_v2'
              AND    table_name = 'document_roles'
            )
        THEN
          DELETE FROM "crm_v2"."document_roles" WHERE document_id IN (
            SELECT document_id FROM "crm_v2"."documents" WHERE document_ref LIKE 'NW/072/0417/002/R01' || CHR(13)
          );

          DELETE FROM "crm_v2"."documents" WHERE document_ref LIKE 'NW/072/0417/002/R01' || CHR(13);
        END IF ;
    END
   $$ ;

DO $$
    BEGIN
        IF EXISTS
            ( SELECT 1
              FROM   information_schema.tables
              WHERE  table_schema = 'crm_v2'
              AND    table_name = 'documents'
            )
        THEN
          DELETE FROM "crm_v2"."documents" WHERE document_ref LIKE 'NW/072/0417/002/R01' || CHR(13);
        END IF ;
    END
   $$ ;

DO $$
    BEGIN
        IF EXISTS
            ( SELECT 1
              FROM   information_schema.tables
              WHERE  table_schema = 'crm'
              AND    table_name = 'document_header'
            )
        THEN
          DELETE FROM crm.document_header WHERE system_external_id LIKE 'NW/072/0417/002/R01' || CHR(13);
        END IF ;
    END
   $$ ;

DO $$
    BEGIN
        IF EXISTS
            ( SELECT 1
              FROM   information_schema.tables
              WHERE  table_schema = 'permit'
              AND    table_name = 'licence'
            )
        THEN
          DELETE FROM permit.licence WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);
        END IF ;
    END
   $$ ;

DO $$
 BEGIN
     IF EXISTS
         ( SELECT 1
           FROM   information_schema.tables
           WHERE  table_schema = 'returns'
           AND    table_name = 'returns'
         )
     THEN
       DELETE FROM "returns"."returns" WHERE licence_ref LIKE 'NW/072/0417/002/R01' || CHR(13);
     END IF ;
 END
$$ ;

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
