ALTER TABLE water.events ALTER COLUMN event_id SET DEFAULT public.gen_random_uuid();
