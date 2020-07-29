exports.createSupplementary = `
insert into
water.billing_batch_charge_versions (billing_batch_id, charge_version_id)
select :billingBatchId, cv.charge_version_id
from water.licences l
  join water.charge_versions cv on l.licence_ref = cv.licence_ref
where
  l.include_in_supplementary_billing = true
  and l.region_id = :regionId::uuid
  and cv.status='current'
  and (cv.end_date is null or cv.end_date > :fromDate)
returning *;`;

exports.createAnnual = `
    insert into water.billing_batch_charge_versions (billing_batch_id, charge_version_id)
    select :billingBatchId, cv.charge_version_id
    from water.licences l
      join water.charge_versions cv on l.licence_ref = cv.licence_ref
    where
      l.region_id = :regionId::uuid
      and l.suspend_from_billing is false
      and (l.expired_date is null or l.expired_date > :fromDate)
      and (l.lapsed_date is null or l.lapsed_date > :fromDate)
      and (l.revoked_date is null or l.revoked_date > :fromDate)
      and (cv.end_date is null or cv.end_date > :fromDate)
      and cv.status='current'
      and cv.charge_version_id not in (
        select distinct cv.charge_version_id
        from water.billing_batches b
        join water.billing_batch_charge_versions cv on b.billing_batch_id=cv.billing_batch_id
        join water.billing_batch_charge_version_years y on
          b.billing_batch_id=y.billing_batch_id
          and cv.charge_version_id=y.charge_version_id
        where b.batch_type in ('annual', 'supplementary')
          and y.financial_year_ending=:toFinancialYearEnding
      )
    returning *;`;

exports.createTwoPartTariff = `
    insert into water.billing_batch_charge_versions (billing_batch_id, charge_version_id)
    select distinct :billingBatchId::uuid, cv.charge_version_id
    from water.licences l
      join water.charge_versions cv on l.licence_ref = cv.licence_ref
      join water.licence_agreements la on l.licence_ref = la.licence_ref
      join water.charge_elements ce on cv.charge_version_id = ce.charge_version_id
    where
      la.financial_agreement_type_id = 'S127'
      and l.region_id = :regionId::uuid
      and l.suspend_from_billing = FALSE
      and (l.expired_date is null or l.expired_date > :fromDate)
      and (l.lapsed_date is null or l.lapsed_date > :fromDate)
      and (l.revoked_date is null or l.revoked_date > :fromDate)
      and (cv.end_date is null or cv.end_date > :fromDate)
      and (la.end_date is null or la.end_date > :fromDate)
      and case
        when :isSummer is true then ce.season in ('summer')
        when :isSummer is false then ce.season in ('winter', 'all year')
      end
      and (
        ce.time_limited_start_date is null
        or (
          ce.time_limited_start_date <= make_date(:toFinancialYearEnding, 3, 31)
          and ce.time_limited_end_date >= make_date(:toFinancialYearEnding-1, 4, 1)
        )
      )
      and cv.charge_version_id not in (
        select distinct cv.charge_version_id
        from water.billing_batches b
        join water.billing_batch_charge_versions cv on b.billing_batch_id=cv.billing_batch_id
        join water.billing_batch_charge_version_years y on
          b.billing_batch_id=y.billing_batch_id
          and cv.charge_version_id=y.charge_version_id
        where b.batch_type='two_part_tariff'
          and b.is_summer=:isSummer
          and y.financial_year_ending=:toFinancialYearEnding
      )
    returning *;`;

exports.deleteByBatchIdAndLicenceId = `
delete from water.billing_batch_charge_versions bcv
  using water.charge_versions cv, water.licences l
  where bcv.billing_batch_id=:billingBatchId
    and bcv.charge_version_id=cv.charge_version_id
    and cv.licence_ref=l.licence_ref
    and l.licence_id=:licenceId
`;
