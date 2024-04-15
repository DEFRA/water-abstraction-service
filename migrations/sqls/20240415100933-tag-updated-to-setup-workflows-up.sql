/*
  Identify workflow setup records with chg versions

  https://eaflood.atlassian.net/browse/WATER-4437

  For context, we found out legacy background jobs scheduled in BullMQ only run intermittently. One we found hadn't run
  for the last 2 years so we agreed to bin it. Two we need to deal with at some point but intermittent is fine for now.
  The critical job, which is putting updated licences into workflow, we solved by migrating to
  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system/pull/903).

  As part of solving it we took the opportunity to add data to the workflow record to allow us to identify that the
  record was added because of an updated licence. We also spotted that our time-limited job was broken 😱 so [fixed
  that](https://github.com/DEFRA/water-abstraction-system/pull/908) and updated it to _also_ add some info to the
  workflow record.

  With these handy bits of info now in the workflow record, it seemed a shame we didn't make the reason why the record
  was added visible to the user.

  That led to [Make manage workflow 'to setup' links
  intelligent](https://github.com/DEFRA/water-abstraction-ui/pull/2549) in the legacy UI code. The last piece of the
  puzzle is the historic `to_setup` records. The new links would be less confusing if the existing records were updated
  to also identify if they are for new licences that need charge information or existing ones that need their details
  checking.

  This is the migration to do just that!
*/
UPDATE water.charge_version_workflows SET "data" = (
  SELECT
  (CASE WHEN EXISTS(SELECT 1 FROM water.charge_versions cv WHERE cv.licence_id = cvw_lookup.licence_id)
        THEN '{"chargeVersion": null, "chargeVersionExists": true}'::jsonb
        ELSE '{"chargeVersion": null, "chargeVersionExists": false}'::jsonb
  END) AS charge_version_exists
  FROM water.charge_version_workflows cvw_lookup
  WHERE cvw_lookup.charge_version_workflow_id = water.charge_version_workflows.charge_version_workflow_id
)
-- Only apply the change to workflow records set as `to_setup` which haven't been touched by the new licence-updates and
-- time-limited jobs
WHERE water.charge_version_workflows.status = 'to_setup'
AND water.charge_version_workflows.date_deleted IS NULL
AND water.charge_version_workflows."data"->>'timeLimitedChargeVersionId' IS NULL
AND water.charge_version_workflows."data"->>'chargeVersionExists' IS NULL;
