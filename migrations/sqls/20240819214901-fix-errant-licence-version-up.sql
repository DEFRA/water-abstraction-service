/*
  Fix errant licence version record

  We had a report that when creating a new charge version for licence **AN/033/0058/018/R01** and selecting use
  abstraction data, the service used an old abstraction volume.

  We tracked the issue down to the fact that there are 2 'current' licence versions linked to the licence (only one
  should ever be current). When the user selects the 'use abstraction data' option, the legacy code selects the first
  'current' licence version connected to the licence. This explains why the value is coming from an older version.

  We think the version got in there from a 'blip', probably caused by the licence in NALD being duplicated and _then_
  corrected with the updated data. Then we believe the import happened in the middle of this, hence the 'blip'.

  Simply put, the errant licence version belongs to the duplicated licence, but all the licence versions for that are
  correct. So, to get **AN/033/0058/018/R01** back into shape, we just need to delete the errant licence version.
*/

BEGIN;

DELETE FROM water.licence_version_purpose_conditions lvpc WHERE lvpc.licence_version_purpose_id IN (
  SELECT lvp.licence_version_purpose_id FROM water.licence_version_purposes lvp WHERE lvp.licence_version_id = '8dce95fd-3654-48af-8649-69eafcb192bc'
);

DELETE FROM water.licence_version_purposes lvp WHERE lvp.licence_version_id = '8dce95fd-3654-48af-8649-69eafcb192bc';

DELETE FROM water.licence_versions lv WHERE lv.licence_version_id = '8dce95fd-3654-48af-8649-69eafcb192bc';

COMMIT;
