/* Replace with your SQL commands */
DELETE FROM "water"."scheduler" WHERE task_type='import';
DELETE FROM "water"."scheduler" WHERE task_type='refreshImport';
