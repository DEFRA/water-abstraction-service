/* Set back to NULL anything we set to unknown */

UPDATE water.scheduled_notification SET "status" = NULL WHERE "status" = 'unknown';
