/*
  Move return versions to correct licence

  https://eaflood.atlassian.net/browse/WATER-4794

  > TL;DR; Never amend a licence reference in NALD!

  While working on WATER-4734, we pulled together a list of all licences deleted from NALD that still exist in WRLS.

  Because we have the latest version of the WATER-4654 (return version data clean-up) changes in our non-prod
  environments (excluding pre), we were expecting no deleted licences to be flagged as having return logs. However, six
  came back in the results.

  We know the changes to clean the return versions handle return versions linked to 'completed' return logs. If this
  scenario occurs, we won't delete it until it can be looked at. So, when cleaning the licences, we can do a bit of a
  shortcut: any WRLS licence due to be deleted which still has a `water.return_version` record must do so because it is
  linked to a 'completed' return log.

  Taking **MD/0280003/012** as an example, we confirmed there are no return logs. Huh. If this licence is deleted in
  NALD, then so must be the return versions and all child records, so why have we not deleted it in our clean job?

  What we found is the NALD return version has not been deleted. It and all the child records remain. However, when we
  look at the NALD licence record it is linked to, it has a `LIC_NO` of **MD/028/0003/012**. Can you spot the
  difference?! 😂

  We've deduced that when first creating the licence in NALD, a typo was made with the licence reference. But WRLS would
  have imported the record and created a `water.licences` record (plus others in the other schemas). When the typo was
  spotted, rather than creating a new NALD licence record, the typo was corrected.

  If the previous team had used the NALD table ID, as they do with all other tables, then the import would have just
  corrected the WRLS licence record. However, they use the licence reference as the unique identifier for reasons known
  only to them! This means the import thinks **MD/028/0003/012** is an entirely new licence, so it creates a second WRLS
  record.

  During the nightly import, the NALD return version records update the existing information, all pointing to the wrong
  WRLS licence record!

  This migration updates the licence to which the affected return versions are linked. The result is that users will see
  the return versions when searching for the licence reference, as it is now set in NALD.
 */

BEGIN;

-- AN/033/0014/068 --> AN/033/0052/047
UPDATE water.return_versions
SET licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'AN/033/0052/047')
WHERE licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'AN/033/0014/068');

-- TH/025/0003/004 --> NE/025/0003/004
UPDATE water.return_versions
SET licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'NE/025/0003/004')
WHERE licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'TH/025/0003/004');

-- 03/28/81/0045/1/RO1 --> 03/28/81/0045/1/R01
UPDATE water.return_versions
SET licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = '03/28/81/0045/1/R01')
WHERE licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = '03/28/81/0045/1/RO1');

-- TH/039/022/005/R01 --> TH/039/0022/005/R01
UPDATE water.return_versions
SET licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'TH/039/0022/005/R01')
WHERE licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'TH/039/022/005/R01');

-- MD/0280003/012 --> MD/028/0003/012
UPDATE water.return_versions
SET licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'MD/028/0003/012')
WHERE licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = 'MD/0280003/012');

-- 2569001253R02 --> 2569001253/R02
UPDATE water.return_versions
SET licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = '2569001253/R02')
WHERE licence_id = (SELECT l.licence_id FROM water.licences l WHERE l.licence_ref = '2569001253R02');

COMMIT;
