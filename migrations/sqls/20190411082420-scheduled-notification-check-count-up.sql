
/**
 * Add a column for the number of status checks and the last check time
 * for each scheduled_notification message
 */
ALTER TABLE "water"."scheduled_notification" ADD COLUMN if not exists status_checks BIGINT;
ALTER TABLE "water"."scheduled_notification" ADD COLUMN if not exists next_status_check timestamp(0);
