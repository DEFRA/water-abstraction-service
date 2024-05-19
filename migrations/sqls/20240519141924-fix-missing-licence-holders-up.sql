/*
  Fix missing licence holder crm_v2 records

  https://eaflood.atlassian.net/browse/WATER-4433
  https://eaflood.atlassian.net/browse/WATER-4434

  When working on the new view licence page we have been working under the premise that the licence holder for all
  licences is known. Unfortunately, during testing we found this is not the case. At the time of creating this migration
  there are 38 licences that do not have the correct record in `crm_v2.document_roles` to denote who the licence holder
  is.

  When we looked at how the legacy service behaved we found that in some cases it _did_ show a licence holder! Further
  digging found that of the 38, 20 have the information stored in `crm.document_header.metadata`. Why these 20 never
  got a `crm_v2.document_roles` created we're chalking up to the brittleness of the legacy code.

  This script adds in the missing records for the 20.

  Whilst digging we also found there were 2 more `crm_v2.documents` (licences by another name) than exists in
  `water.licences`. These we found had invalid licence ref's. We speculate that the import permits the creation of the
  `crm_v2.documents` records but failed when attempting to insert into `water.licences`.

  We've confirmed they no longer exist in the NALD data we receive so clean them out as part of this fix script.
*/

-- The focus of the changes is the crm_v2 schema but we rely on data from water. So, we've added the fix to this repo
-- but it will cause CI to fail if it attempts to run the script. So, we wrap it in a clause that ensures we only run
-- the migration when deployed to an actual environment.
DO $$
  BEGIN
    IF EXISTS
      ( SELECT 1
        FROM   information_schema.tables
        WHERE  table_schema = 'crm_v2'
        AND    table_name = 'document_roles'
      )
    THEN
      /*
        First part - delete invalid licence ref records
      */
      DELETE FROM crm_v2.document_roles WHERE document_id IN (
        SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref IN ('`MD/054/0021/030', '03/28/27/0005 S/G')
      );

      DELETE FROM crm_v2.documents WHERE document_id IN (
        SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref IN ('`MD/054/0021/030', '03/28/27/0005 S/G')
      );

      /*
        Second part - insert missing crm_v2.document_roles records

        We use the 2 exists clauses for 2 reasons. To avoid errors in environments where the water.licences record doesn't
        exist or the crm_v2.document_role already does, most likely because we've previously run the script.
      */

      -- 03/28/22/003303/28/2
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date)
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '03/28/22/003303/28/2' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '2:10020113' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '2:6861' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '03/28/22/003303/28/2' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '03/28/22/003303/28/2' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '03/28/22/003303/28/2'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '03/28/22/003303/28/2' LIMIT 1)
      );

      -- 03/28/81/0045/1/RO1
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date)
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '03/28/81/0045/1/RO1' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '2:10021080' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '2:10024589' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '03/28/81/0045/1/RO1' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '03/28/81/0045/1/RO1' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '03/28/81/0045/1/RO1'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '03/28/81/0045/1/RO1' LIMIT 1)
      );

      -- 24/67/10/0158/R01L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '24/67/10/0158/R01L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '8:3641' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '8:3600' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '24/67/10/0158/R01L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '24/67/10/0158/R01L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '24/67/10/0158/R01L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '24/67/10/0158/R01L' LIMIT 1)
      );

      -- 2569001253R02
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '2569001253R02' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '4:10023743' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '4:10032661' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '2569001253R02' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '2569001253R02' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '2569001253R02'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '2569001253R02' LIMIT 1)
      );

      -- 2569024028/R01L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '2569024028/R01L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '4:10017463' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '4:10020640' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '2569024028/R01L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '2569024028/R01L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '2569024028/R01L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '2569024028/R01L' LIMIT 1)
      );

      -- 4/30/08/*S/0105/L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '4/30/08/*S/0105/L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:10027076' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:10031138' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '4/30/08/*S/0105/L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '4/30/08/*S/0105/L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '4/30/08/*S/0105/L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '4/30/08/*S/0105/L' LIMIT 1)
      );

      -- 5/31/14/*S/0248L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '5/31/14/*S/0248L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:10028124' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:10026619' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '5/31/14/*S/0248L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '5/31/14/*S/0248L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '5/31/14/*S/0248L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '5/31/14/*S/0248L' LIMIT 1)
      );

      -- 6/33/38/*S/0057/L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '6/33/38/*S/0057/L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:10017671' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:39729' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '6/33/38/*S/0057/L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '6/33/38/*S/0057/L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '6/33/38/*S/0057/L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '6/33/38/*S/0057/L' LIMIT 1)
      );

      -- 6/33/44/*S/0271L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '6/33/44/*S/0271L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:24227' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:44409' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '6/33/44/*S/0271L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '6/33/44/*S/0271L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '6/33/44/*S/0271L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '6/33/44/*S/0271L' LIMIT 1)
      );

      -- 6/33/59/*S/0027L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '6/33/59/*S/0027L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:10024371' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:10028049' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '6/33/59/*S/0027L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '6/33/59/*S/0027L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '6/33/59/*S/0027L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '6/33/59/*S/0027L' LIMIT 1)
      );

      -- 8/37/22/*G/0032/R01L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '8/37/22/*G/0032/R01L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:29071' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:51585' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '8/37/22/*G/0032/R01L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '8/37/22/*G/0032/R01L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '8/37/22/*G/0032/R01L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '8/37/22/*G/0032/R01L' LIMIT 1)
      );

      -- 8/37/39/*S/0115L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '8/37/39/*S/0115L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:10016416' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:59089' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = '8/37/39/*S/0115L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = '8/37/39/*S/0115L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = '8/37/39/*S/0115L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = '8/37/39/*S/0115L' LIMIT 1)
      );

      -- AN/034/0003/002/R01L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'AN/034/0003/002/R01L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '1:1689' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '1:2175' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'AN/034/0003/002/R01L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'AN/034/0003/002/R01L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'AN/034/0003/002/R01L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'AN/034/0003/002/R01L' LIMIT 1)
      );

      -- MD/0280003/012
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'MD/0280003/012' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '2:10028353' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '2:10032928' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'MD/0280003/012' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'MD/0280003/012' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'MD/0280003/012'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'MD/0280003/012' LIMIT 1)
      );

      -- MD/054/0002/021/R01L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'MD/054/0002/021/R01L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '2:10026215' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '2:10030066' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'MD/054/0002/021/R01L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'MD/054/0002/021/R01L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'MD/054/0002/021/R01L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'MD/054/0002/021/R01L' LIMIT 1)
      );

      -- NW/069/0002/008/L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'NW/069/0002/008/L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '4:23488' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '4:6372' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'NW/069/0002/008/L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'NW/069/0002/008/L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'NW/069/0002/008/L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'NW/069/0002/008/L' LIMIT 1)
      );

      -- SO/041/0022/015L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'SO/041/0022/015L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '6:10027658' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '6:10032031' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'SO/041/0022/015L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'SO/041/0022/015L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'SO/041/0022/015L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'SO/041/0022/015L' LIMIT 1)
      );

      -- TH/025/0003/004
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'TH/025/0003/004' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '3:10024228' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '3:10033464' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'TH/025/0003/004' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'TH/025/0003/004' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'TH/025/0003/004'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'TH/025/0003/004' LIMIT 1)
      );

      -- TH/037/0051/001L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'TH/037/0051/001L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '7:10021646' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '7:10022035' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'TH/037/0051/001L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'TH/037/0051/001L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'TH/037/0051/001L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'TH/037/0051/001L' LIMIT 1)
      );

      -- WA/055/0021/006L
      INSERT INTO crm_v2.document_roles (document_id, company_id, address_id, role_id, start_date, end_date )
      SELECT
        (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'WA/055/0021/006L' LIMIT 1),
        (SELECT c.company_id FROM crm_v2.companies c WHERE c.external_id = '8:10024927' LIMIT 1),
        (SELECT a.address_id FROM crm_v2.addresses a WHERE a.external_id = '8:10025719' LIMIT 1),
        (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder'),
        (SELECT l.start_date FROM water.licences l WHERE l.licence_ref = 'WA/055/0021/006L' LIMIT 1),
        (SELECT LEAST(l.expired_date, l.lapsed_date, l.revoked_date) FROM water.licences l WHERE l.licence_ref = 'WA/055/0021/006L' LIMIT 1)
      WHERE EXISTS (
        SELECT 1 FROM water.licences l WHERE l.licence_ref = 'WA/055/0021/006L'
      )
      AND NOT EXISTS (
        SELECT 1 FROM crm_v2.document_roles dr
        WHERE dr.role_id = (SELECT r.role_id FROM crm_v2.roles r WHERE r.name = 'licenceHolder')
          AND dr.document_id = (SELECT d.document_id FROM crm_v2.documents d WHERE d.document_ref = 'WA/055/0021/006L' LIMIT 1)
      );
    END IF;
  END
$$ ;
