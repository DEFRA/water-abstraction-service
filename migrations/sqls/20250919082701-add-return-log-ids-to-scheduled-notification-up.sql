/*
  The returns ids are currently stored in the metadata column.

  We want to make these easily accessible so we are adding a 'return_ids' column.

  This will store the return ids for a notification as a json array e.g ["a82c1a23-d7ac-4410-8534-acccab16b850"].

  Some notifications are linked to only one return id (such as the paper forms) but others are linked to multiple return
  ids. This is why we use the jsonb field and saved the ids in an array.
*/

ALTER TABLE water.scheduled_notification ADD COLUMN return_log_ids JSONB DEFAULT NULL;
