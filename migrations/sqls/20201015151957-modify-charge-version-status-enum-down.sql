alter type water.charge_version_workflow_status add value 'draft';

update water.charge_version_workflows set status = 'draft' where status = 'review';

alter type water.charge_version_workflow_status rename to charge_version_workflow_status_old;

create type water.charge_version_workflow_status as enum ('draft', 'changes_requested');

alter table water.charge_version_workflows alter column status type charge_version_workflow_status using status::text::charge_version_workflow_status;

drop type water.charge_version_workflow_status_old;
