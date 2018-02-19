/* Replace with your SQL commands */
-- Table: water.sessions

-- DROP TABLE water.sessions;

CREATE TABLE water.sessions
(
    session_id character varying COLLATE pg_catalog."default" NOT NULL,
    session_data character varying COLLATE pg_catalog."default" NOT NULL,
    ip character varying COLLATE pg_catalog."default" NOT NULL,
    date_created timestamp with time zone NOT NULL,
    date_updated timestamp with time zone,
    CONSTRAINT sessions_pkey PRIMARY KEY (session_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;


