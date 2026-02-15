/*
  https://eaflood.atlassian.net/browse/WATER-5500

  Four new purpose use codes have been added to NALD. This means the also need to be added to WRLS.

  |Code|Description                                              |
  |----|---------------------------------------------------------|
  |700 |Transfer Reabstract Low Loss Spray Irrigation - Direct   |
  |710 |Transfer Reabstract Low Loss Trickle Irrigation - Direct |
  |720 |Transfer Reabstract Low Loss Spray Irrigation - Storage  |
  |730 |Transfer Reabstract Low Loss Trickle Irrigation - Storage|

  This migration adds the new purposes.
*/

BEGIN TRANSACTION;

INSERT INTO water.purposes_uses (legacy_id, description, loss_factor, is_two_part_tariff)
  VALUES ('700', 'Transfer Reabstract Low Loss Spray Irrigation - Direct', 'low', true);

INSERT INTO water.purposes_uses (legacy_id, description, loss_factor, is_two_part_tariff)
  VALUES ('710', 'Transfer Reabstract Low Loss Trickle Irrigation - Direct', 'low', true);

INSERT INTO water.purposes_uses (legacy_id, description, loss_factor, is_two_part_tariff)
  VALUES ('720', 'Transfer Reabstract Low Loss Spray Irrigation - Storage', 'low', true);

INSERT INTO water.purposes_uses (legacy_id, description, loss_factor, is_two_part_tariff)
  VALUES ('730', 'Transfer Reabstract Low Loss Trickle Irrigation - Storage', 'low', true);

COMMIT;
