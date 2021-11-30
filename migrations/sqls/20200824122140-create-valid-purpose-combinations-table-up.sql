create table water.purposes (
    purpose_id uuid PRIMARY KEY default public.gen_random_uuid(),
    purpose_primary_id uuid NOT NULL,
    purpose_secondary_id uuid NOT NULL,
    purpose_use_id uuid NOT NULL,
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP,
    FOREIGN KEY (purpose_primary_id) REFERENCES water.purposes_primary (purpose_primary_id),
    FOREIGN KEY (purpose_secondary_id) REFERENCES water.purposes_secondary (purpose_secondary_id),
    FOREIGN KEY (purpose_use_id) REFERENCES water.purposes_uses (purpose_use_id),
    UNIQUE(purpose_primary_id, purpose_secondary_id, purpose_use_id)
);
