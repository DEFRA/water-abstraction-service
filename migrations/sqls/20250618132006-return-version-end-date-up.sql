/*
https://eaflood.atlassian.net/browse/WATER-5099

This issue was found in production when users created new return versions for water companies that need quarterly returns
enabled. When inserting a new return version between other existing return versions it is setting the end date of one of
the return versions incorrectly. This was due to the the order of the functions that determine which end date to use.
This has now been fixed but we need to update the production data to use the correct end date.

This migration finds all impacted return versions and then updates the end_date.
*/


BEGIN;

update water.return_versions rv
set end_date = results.end_date
from (
select rv1.return_version_id, rv2.start_date - INTERVAL '1 day' as end_date
from water.return_versions rv1
join water.return_versions rv2 on rv1.licence_id = rv2.licence_id and rv1.end_date = rv2.end_date
where
rv1.status = 'current' and rv2.status = 'current' AND
rv1.licence_id = rv1.licence_id AND
rv1.end_date = rv1.end_date
and rv1.version_number != rv2.version_number
and rv1.start_date < rv2.start_date
) results
where
rv.return_version_id = results.return_version_id;

COMMIT;
