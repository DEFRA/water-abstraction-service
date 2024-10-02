/*
  https://eaflood.atlassian.net/browse/WATER-4645

  > Part of the work to migrate return versions from NALD to WRLS

  We recently added new points and sources tables to the service. This not only supports our work on return versions, it
  means we can move away from abstracting point information from the licence JSON blob in `permit.licence`.

  We thought we'd captured everything 'point' related in the change but have since spotted 'Means of abstraction'.

  This is linked to a point in NALD and gives how water will be abstracted there, for example, "Surface Mounted Pump
  (Fixed)". We must capture this information as we import the point information from NALD. So, adds a column to the
  `water.points` table to store this information.
 */

ALTER TABLE IF EXISTS water.points ADD COLUMN abstraction_method text;
