'use strict';

/**
 * A query to get charge versions in a particular region :regionId
 * which are valid for billing based on various date checks
 * over a particular financial year date range :startDate - :endDate
 */
const findValidInRegionAndFinancialYear = `
select distinct cv.*, 
  la.financial_agreement_type_id is not null as is_two_part_tariff
from (
  select cv.charge_version_id,
  greatest(:startDate, l.start_date, cv.start_date) as start_date,
  least(:endDate, l.expired_date, l.lapsed_date, l.revoked_date, cv.end_date) as end_date,
  l.licence_ref, 
  l.licence_id,
  l.include_in_supplementary_billing='yes' as include_in_supplementary_billing
  from water.charge_versions cv
  join water.licences l on cv.licence_ref=l.licence_ref
  where l.region_id=:regionId
    and l.suspend_from_billing = FALSE
    and cv.status='current'
) cv
  left join (
    select * from water.licence_agreements la 
    where (la.end_date is null or la.end_date > :startDate)
    and la.start_date <= :endDate
    and la.financial_agreement_type_id='S127'
  ) la on cv.licence_ref=la.licence_ref

where cv.start_date<:endDate
and (cv.end_date is null or cv.end_date>:startDate)
`;

exports.findValidInRegionAndFinancialYear = findValidInRegionAndFinancialYear;
