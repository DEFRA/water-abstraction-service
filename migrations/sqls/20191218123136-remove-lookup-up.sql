/* Replace with your SQL commands */
DROP TABLE IF EXISTS water.lookup;

DROP INDEX IF EXISTS water.lookup_pkey;

DELETE FROM water.scheduler WHERE task_type='importRepUnits';