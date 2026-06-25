/* Create a new table in the water schema named licence_unregistrations */

BEGIN;

CREATE TABLE water.licence_unregistrations (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  created_by uuid NOT NULL,
  licence_id uuid NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMIT;
