/*
  Fix deleted return requirement points

  https://eaflood.atlassian.net/browse/WATER-5098

  When we started work on moving returns management from NALD to WRLS, we found that the previous team were already
  importing some return version information

  - return versions (NALD_RET_VERSIONS)
  - return requirements (NALD_RET_FORMATS)
  - return requirement purposes (NALD_RET_FMT_PURPOSES)

  However, it wasn't importing points and was missing some information we needed. So, we updated the import to include
  them. We then noticed that users could delete records at various levels of the 'return information' hierarchy in NALD,
  but this wasn't being reflected in WRLS. Hence the epic https://eaflood.atlassian.net/browse/WATER-4654 .

  We ensured that some limits were in place, though, to prevent data from becoming corrupted in WRLS. However, it
  appears that we overlooked a scenario regarding points.

  **Example**

  A Licence has one return version with three return requirements. When you look at the UI, you see

  - 10064056 has 1 point
  - 10064057 has 11 points
  - 10064058 has 1 point

  Behind the scenes, though, we see the following

  - 10064056 has 1 point
  - 10064057 has 11 points
  - 10064058 has 11 points

  The original NALD records align with what you see in the UI.

  **Problem**

  10064058 has too many records linked in the DB. A key aspect of the additional 10 records is that
  `return_requirements_points.point_id` is null.

  It's not causing WRLS a problem, but it is causing RDP a problem.

  What we suspect has happened is that in NALD, the 11 points were first added to 10064058 and just 1 to 10064057. This
  was then imported into WRLS.

  Spotting the mistake, the wrong 10 points were then deleted from 10064058 and added to 10064057 in NALD. The WRLS
  import has added the new records, but set to NULL the point_id for those 10 against 10064058 that got deleted.

  So why didn't the WRLS clean remove the 10 deleted records?

  The clean assumed a return requirement or version has been deleted. So, it was only deleting points where the parent
  return requirement had been deleted. This appears to be a case of points being 'moved', a scenario we hadn't
  considered.

  **Fix**

  Simples! Delete them.
 */

DELETE FROM water.return_requirement_points WHERE point_id IS NULL;
