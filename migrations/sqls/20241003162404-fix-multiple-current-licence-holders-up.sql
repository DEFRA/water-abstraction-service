/*
  https://eaflood.atlassian.net/browse/WATER-4696

  Users reported an issue with licence holder information.

  - Two licence holders were listed on the view licence contact details page (there should only be one)
  - When adding a new charge version, the journey was suggesting to create the new billing account using the old company
    details

  We found the issue was that for this licence, we have two entries in `crm_v2.document_roles` with the role of
  `licenceHolder` and no end dates. In the case of the licence holder, the service derives the 'current' licence holder
  by selecting the one with no end date (there should only be one).

  Because we have 2 with no end date, view contact details shows both. In the legacy charge version journey, it gets all
  licence roles for the licence, filters out any that are not 'licenceHolder', and then selects the first that meets
  this criteria.

  - Start date is before or the same as the chosen date for the new charge version
  - End date is null or after the chosen date for the new charge version

  Again, the old licence holder is the first record to meet these criteria; hence, the legacy code chooses it as the
  'relevant company' to display.

  We believe the 'extra licence holder' results from a licence version in NALD but has since been deleted. We now know
  that [water-abstraction-import](https://github.com/DEFRA.water-abstraction-import) never deletes records on our side
  that no longer exist in NALD. So, this likely has become orphaned because its source record no longer exists in NALD.
 */

DELETE FROM crm_v2.document_roles
WHERE
  document_id = (
    SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '7/34/11/*G/0462'
  )
  AND start_date = '2021-04-20'
  AND end_date IS NULL;
