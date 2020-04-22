/* Replace with your SQL commands */

CREATE TABLE application_state (
	application_state_id varchar not null primary key,
	data jsonb not null,
  date_created timestamp not null,
  date_updated timestamp
);