/* remove unique constraints */
alter table water.charge_versions
  drop constraint uniq_charge_version_external_id;

alter table water.charge_elements
  drop constraint uniq_charge_element_external_id;

/* restore external ids to original values */
update water.charge_versions
  set external_id=split_part(external_id, ':', 2)
  where source='nald'::charge_version_source;

update water.charge_elements ce
  set external_id=sub.new_external_id
  from (
    select ce.charge_element_id, split_part(ce.external_id, ':', 2) as new_external_id
    from water.charge_elements ce
    join water.charge_versions cv on cv.charge_version_id=ce.charge_version_id
    where cv.source='nald'
  ) sub
  where ce.charge_element_id=sub.charge_element_id;

/* restore external ids to original data type */
alter table water.charge_versions
  alter column external_id type integer using (external_id::integer);

alter table water.charge_elements
  alter column external_id type integer using (external_id::integer);

/* restore water.charge_agreements table */
CREATE TABLE water.charge_agreements (
    charge_agreement_id uuid DEFAULT public.gen_random_uuid() PRIMARY KEY,
    charge_element_id uuid NOT NULL REFERENCES water.charge_elements(charge_element_id) ON DELETE CASCADE,
    agreement_code character varying,
    start_date date NOT NULL,
    end_date date,
    signed_date date,
    file_reference character varying,
    description character varying,
    date_created timestamp without time zone NOT NULL DEFAULT now(),
    date_updated timestamp without time zone NOT NULL DEFAULT now()
);
