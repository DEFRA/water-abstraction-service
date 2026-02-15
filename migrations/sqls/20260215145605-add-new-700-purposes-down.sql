/* Drop the new purposes */

BEGIN TRANSACTION;

DELETE FROM water.purposes_uses WHERE legacy_id IN ('700', '710', '720', '730');

COMMIT;
