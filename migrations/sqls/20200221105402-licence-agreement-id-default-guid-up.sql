/* Replace with your SQL commands */

ALTER TABLE water.licence_agreements ALTER COLUMN licence_agreement_id SET DEFAULT public.gen_random_uuid();
