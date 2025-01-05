/*
  https://eaflood.atlassian.net/browse/WATER-4546

  > Part of the work to migrate management of return versions to WRLS from NALD

  During the import from NALD, if a licence end date is changed, for example, it has been revoked in NALD our return
  versions functionality needs to know about it. This is so we can reissue the return logs for the licence in order to
  match the changed end date.

  We are actively trying to move away from the legacy code base, so this work was always going to be done in
  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system).

  When the [NALD import job](https://github.com/DEFRA/water-abstraction-team/blob/main/jobs/import.md#nald-import) has
  completed downloading and extracting the NALD data, it will trigger an endpoint in
  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) that will compare the NALD licence end
  dates to the WRLS licence end dates.

  Where these differ, the results will be captured in this table.

  Then when the [Licence import
  job](https://github.com/DEFRA/water-abstraction-team/blob/main/jobs/import.md#licence-import) runs it will trigger
  another endpoint in water-abstraction-system that will using this information to

  - set supplementary billing flags
  - reissue return logs

*/
CREATE TABLE water.licence_end_date_changes (
  id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
  licence_id uuid NOT NULL,
  date_type text NOT NULL,
  nald_date date NULL,
  wrls_date date NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
