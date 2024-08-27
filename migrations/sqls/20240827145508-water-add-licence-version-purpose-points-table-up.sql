/* Replace with your SQL commands */

CREATE TABLE water.licence_version_purpose_points (
	id uuid PRIMARY KEY DEFAULT public.gen_random_uuid() NOT NULL,
	licence_version_purpose_id uuid NOT NULL,
	description text NULL,
	ngr_1 text NOT NULL,
	ngr_2 text NULL,
	ngr_3 text NULL,
	ngr_4 text NULL,
	external_id text NULL,
	date_created timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	date_updated timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	nald_point_id int4 NOT NULL,
	CONSTRAINT licence_version_purpose_points_external_id_key UNIQUE (external_id)
);
