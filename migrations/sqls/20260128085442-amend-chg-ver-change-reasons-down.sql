/* Revert changes to change_reasons */

BEGIN TRANSACTION;

UPDATE water.change_reasons cr
SET
  is_enabled_for_new_charge_versions = true
WHERE
  cr.description = 'Strategic review of charges (SRoC)';

DELETE FROM water.change_reasons cr WHERE cr.description = 'Change to charge scheme';

DELETE FROM water.change_reasons cr WHERE cr.description = 'Error correction';

COMMIT;
