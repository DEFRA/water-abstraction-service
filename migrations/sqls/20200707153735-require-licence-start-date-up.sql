/*
licences with a null start date are invalid and are being updated in NALD.
Until then, we are removing them as they cause an issue with charging
they should be re-imported in future when they have been corrected
*/

delete from water.charge_agreements a
	using water.charge_elements e, water.charge_versions v, water.licences l
	where a.charge_element_id=e.charge_element_id
	  and e.charge_version_id=v.charge_version_id
	  and v.licence_ref=l.licence_ref
	  and l.start_date is null;

delete from water.billing_transactions tx
	using water.charge_elements e, water.charge_versions v, water.licences l
	where tx.charge_element_id = e.charge_element_id
	  and e.charge_version_id=v.charge_version_id
	  and v.licence_ref=l.licence_ref
	  and l.start_date is null;

delete from water.billing_volumes bv
	using water.charge_elements e, water.charge_versions v, water.licences l
	where bv.charge_element_id = e.charge_element_id
	  and e.charge_version_id=v.charge_version_id
	  and v.licence_ref=l.licence_ref
	  and l.start_date is null;

delete from water.charge_elements e
	using water.charge_versions v, water.licences l
	where e.charge_version_id=v.charge_version_id
	  and v.licence_ref=l.licence_ref
	  and l.start_date is null;

delete from water.billing_batch_charge_version_years y
	using water.licences l, water.charge_versions cv
	where y.charge_version_id = cv.charge_version_id
		and cv.licence_ref = l.licence_ref
	  and l.start_date is null;

delete from water.billing_batch_charge_versions v
	using water.licences l, water.charge_versions cv
	where v.charge_version_id = cv.charge_version_id
		and cv.licence_ref = l.licence_ref
	  and l.start_date is null;

delete from water.charge_versions v
	using water.licences l
	where v.licence_ref=l.licence_ref
	  and l.start_date is null;

delete from water.licence_version_purposes p
 	using water.licence_versions v, water.licences l
 	where p.licence_version_id=v.licence_version_id
 	  and v.licence_id=l.licence_id
 	  and l.start_date is null;

delete from water.licence_versions v
 	using water.licences l
 	where v.licence_id=l.licence_id
 	  and l.start_date is null;

delete from water.licences where start_date is null;

/*
Now set a not null constraint to prevent in future
*/
alter table water.licences
  alter column start_date set not null;
