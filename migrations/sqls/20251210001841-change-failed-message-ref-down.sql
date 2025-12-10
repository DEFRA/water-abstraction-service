/* Revert the change */

UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation failed' WHERE sn.message_ref = 'returns invitation alternate';
