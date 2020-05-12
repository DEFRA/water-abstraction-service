CREATE TABLE water.pending_import (
    licence_ref character varying NOT NULL,
    status smallint,
    id bigserial primary key,
    date_created timestamp(0) without time zone DEFAULT now(),
    date_updated timestamp(0) without time zone DEFAULT now(),
    log character varying,
    priority bigint
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX uniq_licence_ref ON water.pending_import(licence_ref);
CREATE INDEX pending_import_idx_status_priority ON water.pending_import(status, priority);
