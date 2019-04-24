/* Replace with your SQL commands */
ALTER TABLE "water"."scheduled_notification" DROP COLUMN IF EXISTS "status_checks";
ALTER TABLE "water"."scheduled_notification" DROP COLUMN IF EXISTS "next_status_check";
