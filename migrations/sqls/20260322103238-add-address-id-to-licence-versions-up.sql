/*
  https://eaflood.atlassian.net/browse/WATER-5424

  As part of the 'view my licence 2.0' changes, we needed to show details for a licence version in the view licence
  version page.

  In addition to when the licence version started, ended, and was issued, we also need to show who the licence holder
  was for that version.

  In [Create licence version holders table](https://github.com/DEFRA/water-abstraction-service/pull/2759), we added the
  `water.licence_version_holders` table to make that task much simpler.

  We then [amended the NALD import](https://github.com/DEFRA/water-abstraction-import/pull/1145) to populate this table
  with the licence holder details for each licence version.

  In a later change, we then [added additional columns to licence ver. holders
  table](https://github.com/DEFRA/water-abstraction-service/pull/2777), including the WRLS `company_id`.

  We're in the middle of a review of our current CRM functionality and data, but one of our goals has always been to
  move to a 'single source' for licence and contact information.

  NALD parties are imported to `crm_v2.companies`, and addresses to `crm_v2.addresses`. The thinking was that adding
  `company_id` would create a link between our new licence holder records and the existing company records. Should
  `crm_v2.companies` become our 'single source', and the new field is always fully populated, the link will already be
  in place, and we can drop the other address fields, which would be redundant.

  We've since realised that there is no one-to-one relationship between a `crm_v2.company` and its address. For a start,
  `crm_v2.company_addresses` has a role field, so you have to know the role to know which address is relevant. But then
  we've also realised that `company_addresses` is a WRLS invention. It is generated based on two NALD tables.

  - Licence versions
  - Licence roles

  Both tables feature a party and address ID. So, a company can have multiple addresses per role, because a NALD user
  may select different address records when assigning the party to different licences. This means we _cannot_ determine
  everything we need from just [the company ID on the licence versions
  table](https://github.com/DEFRA/water-abstraction-service/pull/2789). We also need to capture the `address_id` if we
  want to make `water.licence_version_holders` redundant.

  This migration adds the field to `water.licence_versions` and `water.licence_version_holders`.
*/

-- Add the new columns
ALTER TABLE water.licence_versions ADD COLUMN address_id UUID;

ALTER TABLE water.licence_version_holders ADD COLUMN address_id UUID;
