/*
  https://eaflood.atlassian.net/browse/WATER-5688

  The RDP team brought a query to us. They had found an example of a return log where the return requirement it was
  linked to did not exist.

  When we checked the replica, we found it did. So, they dug a little deeper and found that RDP was not importing the
  record because it had an invalid abstraction start date

  - day = 31
  - month = 4

  There are only 30 days in April, so when RDP tries to ingest the record, it throws an error.

  We've checked the DB, both start and end dates, and fortunately, this is the only example of an invalid date.

  This script fixes the record.

  > NOTE: We use the external_id rather than return_requirement_id because this record was imported across multiple
  > environments, so it will differ in each, whereas external_id will be consistent.
*/

UPDATE water.return_requirements rr
SET
  abstraction_period_start_day = 30
WHERE
  rr.external_id = '1:7998';
