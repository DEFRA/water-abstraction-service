/*
  Fix duplicate licence record caused by leading space in 2nd NALD

  https://eaflood.atlassian.net/browse/WATER-4369

  Searching for 7/34/06/\*G/0309 is crashing the service. It is because there are 2 of them in the DB. One of the records
  has a leading space in front of the licence reference.

  Clearly, water-abstraction-import is not stripping whitespace. So, the computer sees these as completely different
  values, meaning it has imported both.

  This migration removes the problem record.
*/
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
            SELECT document_id FROM "crm_v2"."documents" WHERE document_ref = ' 7/34/06/*G/0309/R01'
          );
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
          DELETE FROM "crm_v2"."documents" WHERE document_ref = ' 7/34/06/*G/0309/R01';
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
          DELETE FROM crm.document_header WHERE system_external_id = ' 7/34/06/*G/0309/R01';
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
          DELETE FROM permit.licence WHERE licence_ref = ' 7/34/06/*G/0309/R01';
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
        DELETE FROM "returns"."returns" WHERE licence_ref = ' 7/34/06/*G/0309/R01';
      END IF ;
  END
  $$ ;

DELETE FROM water.licence_version_purpose_conditions WHERE licence_version_purpose_id IN (
  SELECT licence_version_purpose_id FROM water.licence_version_purposes WHERE licence_version_id IN (
    SELECT licence_version_id FROM water.licence_versions WHERE licence_id IN (
      SELECT licence_id FROM water.licences WHERE licence_ref = ' 7/34/06/*G/0309/R01'
    )
  )
);

DELETE FROM water.licence_version_purposes WHERE licence_version_id IN (
  SELECT licence_version_id FROM water.licence_versions WHERE licence_id IN (
    SELECT licence_id FROM water.licences WHERE licence_ref = ' 7/34/06/*G/0309/R01'
  )
);

DELETE FROM water.licence_versions WHERE licence_id IN (
  SELECT licence_id FROM water.licences WHERE licence_ref = ' 7/34/06/*G/0309/R01'
);

DELETE FROM water.return_requirement_purposes WHERE return_requirement_id IN (
  SELECT return_requirement_id  FROM water.return_requirements WHERE return_version_id IN (
    SELECT return_version_id FROM water.return_versions WHERE licence_id IN (
      SELECT licence_id FROM water.licences WHERE licence_ref = ' 7/34/06/*G/0309/R01'
    )
  )
);

DELETE FROM water.return_requirements WHERE return_version_id IN (
  SELECT return_version_id FROM water.return_versions WHERE licence_id IN(
    SELECT licence_id FROM water.licences WHERE licence_ref = ' 7/34/06/*G/0309/R01'
  )
);

DELETE FROM water.return_versions WHERE licence_id IN (
  SELECT licence_id FROM water.licences WHERE licence_ref = ' 7/34/06/*G/0309/R01'
);

DELETE FROM water.licences WHERE licence_ref = ' 7/34/06/*G/0309/R01';
