/* Replace with your SQL commands */

BEGIN;

CREATE TABLE water.licence_version_holders (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  licence_version_id uuid NOT NULL,
  holder_type TEXT DEFAULT 'organisation' NOT NULL,
  salutation TEXT,
  initials TEXT,
  forename TEXT,
  name TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  address_line_3 TEXT,
  address_line_4 TEXT,
  town TEXT,
  county TEXT,
  country TEXT,
  postcode TEXT,
  reference TEXT,
  description TEXT,
  local_name TEXT,
  last_changed DATE,
  disabled bool DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE water.licence_version_holders ADD CONSTRAINT licence_version_id_unique UNIQUE (licence_version_id);

COMMIT;
