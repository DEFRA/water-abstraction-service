/*
During the creation of the licence history page, we noticed we were missing the model and helper for the notes table.
This is being referenced when extracting charge versions for a licence and any relating notes created.
This is being worked on in the [Create notes table model, helper, and view]
(https://github.com/DEFRA/water-abstraction-system/pull/1240) in the water-abstraction-system repo.

While working on the change we realised the notes table has fields that are unused:

- `licence_id` - is never populated
- `type` - is always set to 'charge-version'
- `type_id` - is set to the charge version's id and is not needed to link the two together

We do not these fields included in the view for the notes table that we will add to [water-abstraction-system]
(https://github.com/DEFRA/water-abstraction-system). However, `type` and `type_id` are set as not-nullable.
This change defaults type to 'charge-version' and`type_id` will remove the constraint.
*/
BEGIN;

ALTER TABLE IF EXISTS water.notes ALTER COLUMN type_id DROP NOT NULL;
ALTER TABLE IF EXISTS water.notes ALTER COLUMN "type" SET DEFAULT 'charge_version';

COMMIT;
