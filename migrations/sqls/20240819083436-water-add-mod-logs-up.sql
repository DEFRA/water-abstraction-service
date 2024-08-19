/*
  Add mod -logs table

  > Part of the work to display a licence's history to users (mod log)

  Adds a table to hold imported mod logs from NALD.

  NALD has a concept called 'mod log'. Essentially, when someone creates a new licence, charge or return version, they
  are required to provide a reason and can also add a note.

  Rather than this being stored against each record, the 'mod log' is stored in a single place. Users can then view a
  licence's 'mod logs' to get a sense of the history of the licence.

  When charging switched from NALD to WRLS, we (the previous team) built the ability to record a reason and note against
  a new charge version but didn't import any historic data. With return requirements also soon to switch from NALD to
  WRLS there is a concern that this view of changes made to a licence will be lost.

  Having reviewed how the information is held in NALD we've confirmed that we can extract this information and import it
  as part of the NALD import.
*/

BEGIN;

CREATE TABLE water.mod_logs (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
	external_id varchar NOT NULL,
	event_code varchar NOT NULL,
	event_description varchar NOT NULL,
	reason_type varchar NULL,
	reason_code varchar NULL,
	reason_description varchar NULL,
	nald_date date NOT NULL,
	user_id varchar NOT NULL,
	note text NULL,
	licence_ref varchar NOT NULL,
	licence_external_id varchar NOT NULL,
	licence_id uuid NULL,
	licence_version_external_id varchar NULL,
	licence_version_id uuid NULL,
	charge_version_external_id varchar NULL,
	charge_version_id uuid NULL,
	return_version_external_id varchar NULL,
	return_version_id uuid NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT uniq_mod_log_external_id UNIQUE (external_id)
);

COMMIT;
