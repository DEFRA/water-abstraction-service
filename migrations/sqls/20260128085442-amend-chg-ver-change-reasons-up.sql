/*
  https://eaflood.atlassian.net/browse/WATER-5242

  The users responsible for setting up new charge versions have fed back that they would like to update the list of
  reasons available to select from when amending a charge version.

  "Strategic review of charges (SROC)" is no longer required (all licences have now been processed). Instead, they would
  prefer a more general "Change to charge scheme" to cover any future changes to our charge schemes.

  They would also like to add "Error correction", as it has proved extremely useful when managing return versions.

  This migration update the list of `change_reasons` accordingly.
*/

BEGIN TRANSACTION;

UPDATE water.change_reasons cr
SET
  is_enabled_for_new_charge_versions = false
WHERE
  cr.description = 'Strategic review of charges (SRoC)';

INSERT INTO water.change_reasons (
  description,
  date_created,
  date_updated,
  "type",
  is_enabled_for_new_charge_versions
)
VALUES (
  'Change to charge scheme',
  NOW(),
  NOW(),
  'new_chargeable_charge_version'::water.change_reason_type,
  true
);

INSERT INTO water.change_reasons (
  description,
  date_created,
  date_updated,
  "type",
  is_enabled_for_new_charge_versions
)
VALUES (
  'Error correction',
  NOW(),
  NOW(),
  'new_chargeable_charge_version'::water.change_reason_type,
  true
);

COMMIT;
