/* create new columns */
alter table water.charge_versions 
  add column company_id uuid;

alter table water.charge_versions 
  add column invoice_account_id uuid;

/* update charge versions with data from other tables in services */
update water.charge_versions t
  set 
    invoice_account_id=t2.invoice_account_id,  
    company_id=t2.company_id 
  from (
    select cv.charge_version_id, ia.invoice_account_id, c.company_id from water.charge_versions cv
      join import."NALD_CHG_VERSIONS" ncv on cv.region_code=ncv."FGAC_REGION_CODE"::integer and cv.external_id=ncv."AABL_ID"::integer and cv.version_number=ncv."VERS_NO"::integer
      join crm_v2.invoice_accounts ia on ncv."AIIA_IAS_CUST_REF"=ia.invoice_account_number
      join import."NALD_LH_ACCS" nlh on ncv."AIIA_ALHA_ACC_NO"=nlh."ACC_NO" and ncv."FGAC_REGION_CODE"=nlh."FGAC_REGION_CODE"
      join crm_v2.companies c on concat_ws(':', nlh."FGAC_REGION_CODE", nlh."ACON_APAR_ID")=c.external_id
  ) t2
  where t.charge_version_id=t2.charge_version_id;

/* delete any charge versions where the invoice account ID or company ID is invalid */
delete from water.charge_versions where invoice_account_id is null or company_id is null;

/* add not null constraints */
alter table water.charge_versions 
  alter column invoice_account_id SET NOT NULL;

alter table water.charge_versions 
  alter column company_id SET NOT NULL;