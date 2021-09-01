/* Replace with your SQL commands */
CREATE SEQUENCE if not exists "scheduler_task_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

CREATE TABLE water.scheduler
(
    task_id integer NOT NULL DEFAULT nextval('water.scheduler_task_id_seq'::regclass),
    task_type character varying COLLATE pg_catalog."default" NOT NULL,
    licence_ref character varying COLLATE pg_catalog."default" NOT NULL,
    task_config character varying COLLATE pg_catalog."default",
    next_run timestamp(0) without time zone,
    last_run timestamp(0) without time zone,
    log character varying COLLATE pg_catalog."default",
    status smallint,
    running smallint DEFAULT 0,
    date_created timestamp(0) without time zone DEFAULT now(),
    date_updated timestamp(0) without time zone DEFAULT now(),
    CONSTRAINT scheduler_pkey PRIMARY KEY (task_type, licence_ref)
)
WITH (
    OIDS = FALSE
);

insert into water.scheduler
  (task_type, licence_ref, task_config, next_run, status, running, date_created)
  values
  ('refreshGaugingStations', '-', '{"count":"1","period":"day"}', now(), 0, 0, now()),
  ('updateNotificationEvents', '-', '{"count":"2","period":"minute"}', now(), 0, 0, now());
