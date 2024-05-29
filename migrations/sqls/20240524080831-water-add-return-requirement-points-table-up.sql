create table water.return_requirement_points (
    id uuid primary key default public.gen_random_uuid(),
    return_requirement_id uuid not null,
    description text,
    ngr_1 text not null,
    ngr_2 text,
    ngr_3 text,
    ngr_4 text,
    external_id text not null,
    unique(external_id)
);
