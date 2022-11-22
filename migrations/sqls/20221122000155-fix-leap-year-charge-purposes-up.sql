/* This query updates leap year end abstraction period values. Some SROC charge versions were imported with abstraction
periods that ended on 29-Feb. The issue is this applies each year so we don't record a year. Instead that gets added
when we come to display the date in the UI. The problem is not all years are leap years. When the service tries
to create a date of `02-FEB-2022` it errors because that date never happened.

The accepted fix is to update the date to 28-FEB */

BEGIN;
UPDATE
  water.charge_purposes
SET
  abstraction_period_end_day = 28
WHERE
  abstraction_period_end_day = 29
  AND abstraction_period_end_month = 2;
COMMIT;
