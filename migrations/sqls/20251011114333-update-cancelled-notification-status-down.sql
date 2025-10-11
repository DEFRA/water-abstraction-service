/* Reverse the status change */

UPDATE water.scheduled_notification SET status = 'sent' WHERE notify_status = 'cancelled';
