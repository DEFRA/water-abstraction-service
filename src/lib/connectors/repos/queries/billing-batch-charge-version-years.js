exports.findStatusCountsByBatchId = `
select status, count(*) 
  from water.billing_batch_charge_version_years y
  where billing_batch_id = :batchId
  group by status
`;
