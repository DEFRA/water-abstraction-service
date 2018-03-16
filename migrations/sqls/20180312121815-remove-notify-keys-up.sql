/* Replace with your SQL commands */
UPDATE "water"."notify_templates" SET notify_key='live' WHERE notify_key ILIKE 'livewaterabstraction-%';
UPDATE "water"."notify_templates" SET notify_key='test' WHERE notify_key ILIKE 'testwaterabstraction-%';
UPDATE "water"."notify_templates" SET notify_key='whitelist' WHERE notify_key ILIKE 'whitelistwaterabstraction-%';
