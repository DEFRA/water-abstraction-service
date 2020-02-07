'use strict';

const { pool } = require('../../../lib/connectors/db');
const repos = require('../../../lib/connectors/repository');

const deleteBatchJobs = batchId => {
  const query = `
    delete from water.job
    where name like '%billing%'
    and data::text like $1;
  `;

  return pool.query(query, [batchId]);
};

const deleteBatch = async batchId => {
  await repos.billingBatchChargeVersionYears.deleteByBatchId(batchId);
  await repos.billingBatchChargeVersions.deleteByBatchId(batchId);
  await repos.billingTransactions.deleteByBatchId(batchId);
  await repos.billingInvoiceLicences.deleteByBatchId(batchId);
  await repos.billingInvoices.deleteByBatchId(batchId);
  await repos.billingBatches.deleteByBatchId(batchId);
};

const getAcceptanceTestUserBatchIds = async () => {
  const { rows } = await pool.query(`
    select e.metadata->'batch'->>'billing_batch_id' as billing_batch_id
    from water.events e
    where strpos(e.type, 'billing-batch') = 1
    and strpos(e.issuer, 'acceptance-test') = 1;
  `);

  return rows.map(batch => batch.billing_batch_id);
};

const getAnglianAndMidlandsBatchIds = async () => {
  const { rows } = await pool.query(`
    select b.billing_batch_id
    from water.billing_batches b
      join water.regions r on b.region_id = r.region_id
    where r.charge_region_id in ('A', 'B');
  `);

  return rows.map(batch => batch.billing_batch_id);
};

const deleteUniqueBatches = async (batchIds = []) => {
  const toDelete = new Set(batchIds);

  for (const batchId of toDelete) {
    await Promise.all([deleteBatch(batchId), deleteBatchJobs(batchId)]);
  }
};

/**
 * Delete all the batches that the acceptance test user might have created,
 * and delete all the batches for the Anglian and Midlands regions so that future
 * tests can create a batch.
 */
const deleteBatches = async () => {
  const [acceptanceTestBatchIds = [], areaBatchIds = []] = await Promise.all([
    getAcceptanceTestUserBatchIds(),
    getAnglianAndMidlandsBatchIds()
  ]);

  await deleteUniqueBatches(acceptanceTestBatchIds.concat(areaBatchIds));
};

exports.delete = deleteBatches;
