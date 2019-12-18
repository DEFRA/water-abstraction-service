-- Table Definition ----------------------------------------------

CREATE TABLE IF NOT EXISTS water.lookup (
    lookup_id character varying PRIMARY KEY,
    type character varying NOT NULL,
    key character varying NOT NULL,
    value character varying,
    metadata jsonb,
    created timestamp(0) without time zone,
    modified timestamp(0) without time zone
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS lookup_pkey ON water.lookup(lookup_id text_ops);


-- Insert scheduled job
INSERT INTO water.scheduler 
    (task_type, licence_ref, task_config, next_run, status, running, date_created, date_updated)
  VALUES 
    ('importRepUnits', '', '{"count":1,"period":"day"}', '2019-12-18 10:00:00', 0, 0, NOW(), NOW());