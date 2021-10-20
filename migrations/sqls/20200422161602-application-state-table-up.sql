/* Replace with your SQL commands */

CREATE TABLE application_state (
	application_state_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key varchar not null unique,
	data jsonb not null,
  date_created timestamp not null,
  date_updated timestamp
);
