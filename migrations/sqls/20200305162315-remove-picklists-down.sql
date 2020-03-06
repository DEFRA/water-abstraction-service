CREATE TABLE water.picklists
(
    picklist_id character varying COLLATE pg_catalog."default" NOT NULL,
    name character varying COLLATE pg_catalog."default" NOT NULL,
    id_required boolean NOT NULL,
    created timestamp without time zone NOT NULL,
    modified timestamp without time zone,
    CONSTRAINT picklists_pkey PRIMARY KEY (picklist_id)
);

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

ALTER TABLE "water"."picklist_items" ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

ALTER TABLE "water"."picklist_items" DROP CONSTRAINT  IF EXISTS uniq_list_id;
CREATE UNIQUE INDEX uniq_list_id ON  "water"."picklist_items"  (picklist_id, LOWER(id));

ALTER TABLE "water"."picklist_items" DROP CONSTRAINT  IF EXISTS uniq_list_value;
CREATE UNIQUE INDEX uniq_list_value ON  "water"."picklist_items" (picklist_id, LOWER(value));
