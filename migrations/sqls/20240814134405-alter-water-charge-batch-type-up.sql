/*
  Alters the charge_batch_type data type to add the new batch type tpt_supplementary
*/

BEGIN;

ALTER TYPE water.charge_batch_type ADD VALUE IF NOT EXISTS 'two_part_supplementary';

COMMIT;
