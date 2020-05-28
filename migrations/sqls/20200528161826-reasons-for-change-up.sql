/* Replace with your SQL commands */
CREATE TABLE water.change_reasons (
	change_reason_id uuid DEFAULT public.gen_random_uuid() PRIMARY KEY,
  nald_reason_code varchar unique,
	description varchar not null,
  sort_order integer,
  date_created timestamp not null,
  date_updated timestamp
);


