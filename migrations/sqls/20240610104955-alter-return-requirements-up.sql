/*
  Adds a column to allow us to capture all 3 NALD reporting frequencies

  We recently extended the import of return requirements from NALD to include the frequency with which returns need to
  be collected. We thought with this and `returns_frequency` we would have the data we need to support the return
  requirements setup journey.

  However, we now realise we made an incorrect assumption about what `returns_frequency` represents. We thought it was
  the reporting frequency; however it turns out NALD has 3 frequency levels.

  - Return to agency (`ARTC_RET_FREQ_CODE`)
  - Recording (`ARTC_REC_FREQ_CODE`)
  - Collection (`ARTC_CODE`)

  Because we assumed `ARTC_RET_FREQ_CODE` was reporting, we're importing `ARTC_REC_FREQ_CODE` as collection. Now we know
  it should have been

  - `ARTC_REC_FREQ_CODE` is reporting frequency
  - `ARTC_CODE` is collection frequency

  We don't want to touch `ARTC_RET_FREQ_CODE` because we're still not 100% sure that nothing in the legacy code is using
  these tables. So, this adds a new `reporting_frequency` column to `water.return_requirements`.
*/

BEGIN;

ALTER TABLE water.return_requirements ADD reporting_frequency text NOT NULL DEFAULT 'day';

COMMIT;
