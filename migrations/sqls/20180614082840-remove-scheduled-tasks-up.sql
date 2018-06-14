/* Replace with your SQL commands */

DELETE FROM "water"."scheduler" WHERE task_type='sendScheduledNotifications' OR task_type='updateNotifyStatus';
