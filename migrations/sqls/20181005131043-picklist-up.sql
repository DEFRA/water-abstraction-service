CREATE TABLE water.picklists
(
    picklist_id character varying COLLATE pg_catalog."default" NOT NULL,
    name character varying COLLATE pg_catalog."default" NOT NULL,
    id_required boolean NOT NULL,
    created timestamp without time zone NOT NULL,
    modified timestamp without time zone,
    CONSTRAINT picklists_pkey PRIMARY KEY (picklist_id)
);


-- Table: water.picklist_items

-- DROP TABLE water.picklist_items;

CREATE TABLE water.picklist_items
(
    picklist_item_id character varying COLLATE pg_catalog."default" NOT NULL,
    picklist_id character varying COLLATE pg_catalog."default" NOT NULL,
    value character varying COLLATE pg_catalog."default",
    id character varying COLLATE pg_catalog."default",
    created timestamp without time zone NOT NULL,
    modified timestamp without time zone,
    CONSTRAINT picklist_items_pkey PRIMARY KEY (picklist_item_id),
    CONSTRAINT uniq_list_id UNIQUE (picklist_id, id),
    CONSTRAINT uniq_list_value UNIQUE (picklist_id, value),
    CONSTRAINT picklist_id FOREIGN KEY (picklist_id)
        REFERENCES water.picklists (picklist_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);
