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
)
