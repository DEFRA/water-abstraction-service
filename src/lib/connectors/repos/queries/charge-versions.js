'use strict';

/**
 * A query to get charge versions in a particular region :regionId
 * which are valid for billing based on various date checks
 * over a particular financial year date range :startDate - :endDate
 */
const findValidInRegionAndFinancialYear = `
select distinct
  t1.charge_version_id, 
  lower(t1.charge_period_dates) as start_date, 
  upper(t1.charge_period_dates) as end_date,
  t1.licence_ref,
  t1.licence_id,
  t1.include_in_supplementary_billing,
  t2.two_part_tariff_dates<>'empty' as is_two_part_tariff
from (
  select
    cv.charge_version_id,
    -- Licence date range
    daterange(
      l.start_date,
      least(l.expired_date, l.lapsed_date, l.revoked_date)
    )
    *
    -- Charge version date range
    daterange(
     cv.start_date,
     cv.end_date
    ) 
    *
    -- Financial year date range
    daterange(
      make_date(:financialYearEnding-1, 4, 1),
      make_date(:financialYearEnding, 3, 31)
    ) as charge_period_dates,
    l.licence_ref,
    l.licence_id,
    l.include_in_supplementary_billing='yes' as include_in_supplementary_billing
  from water.charge_versions cv
  join water.licences l on cv.licence_ref=l.licence_ref
  left join water.change_reasons cr
    on cv.change_reason_id = cr.change_reason_id
  where l.region_id=:regionId
    and cv.status='current'
    and (cv.change_reason_id is null or cr.type = 'new_chargeable_charge_version')
    and l.licence_id not in (
      select cvw.licence_id 
      from water.charge_version_workflows cvw
      where cvw.date_deleted is null
    )
) t1
-- Join licence agreements where there is an intersection between the 
-- charge period and the two-part tariff agreement date range
left join (
  select 
    la.licence_agreement_id,
    la.licence_ref, 
    daterange(la.start_date, la.end_date) as two_part_tariff_dates
    from water.licence_agreements la
    join water.financial_agreement_types a on la.financial_agreement_type_id=a.financial_agreement_type_id
    where a.financial_agreement_code='S127' 
      and (la.end_date is null or la.end_date>=la.start_date) and date_deleted IS NULL
) t2 on t1.licence_ref=t2.licence_ref and t1.charge_period_dates * t2.two_part_tariff_dates <> 'empty'
where t1.charge_period_dates <> 'empty'
`;

exports.findValidInRegionAndFinancialYear = findValidInRegionAndFinancialYear;
