/*
  https://eaflood.atlassian.net/browse/WATER-5699
  Migrate the existing event records into `water.licence_unregistrations`, then delete them from `water.events`
*/

DO $$
BEGIN
  IF EXISTS
    (
      SELECT
        1
      FROM
        information_schema.tables
      WHERE
        table_schema = 'crm'
        AND table_name = 'document_header'
    )
  AND EXISTS
    (
      SELECT
        1
      FROM
        information_schema.tables
      WHERE
        table_schema = 'idm'
        AND table_name = 'users'
    )
  THEN
    WITH event_data AS (
      SELECT
        e.created AT TIME ZONE 'UTC' as created_at,
        u.id as created_by,
        e.event_id,
        l.licence_id
      FROM
        water.events e
      INNER JOIN
        idm.users u
      ON
        e.issuer = u.user_name
      INNER JOIN
        crm.document_header dh
      ON
        e.metadata->>'documentId' = dh.document_id
      INNER JOIN
        water.licences l
      ON
        dh.system_external_id = l.licence_ref
      WHERE
        e.type = 'unlink-licence'
    )

    INSERT INTO water.licence_unregistrations (created_by, licence_id, created_at)
    SELECT
      created_by,
      licence_id,
      created_at
    FROM
      event_data;

    DELETE FROM water.events e
    WHERE
      e.type = 'unlink-licence';
  END IF;
END
$$;
