/*
  Fix billing transactions for deleted licence

  https://eaflood.atlassian.net/browse/WATER-4800

  A while back we added a data fix migration:
  [Fix bill history caused by edited licence in NALD](http://github.com/DEFRA/water-abstraction-service/pull/2676).

  This was for a licence which was amended in NALD. The original licence number was mis-typed but rather than creating a
  new licence record they amended the existing one. This led to two licence records being created in WRLS. The issue
  was that bills had been raised against the record with the wrong licence ref.

  Pull request #2676 was to link those bill and bill licences records to the correct licence record. Then the clean job
  in [water-abstraction-import](https://github.com/DEFRA/water-abstraction-import) could safely remove the incorrect
  one.

  We thought it had, but we've since found the record is still in the table. It looked deleted because the search was
  no longer finding it.

  The thing blocking its deletion is that the wrong licence, is linked to a charge version, that is linked to a
  charge element, that is linked to the bills that we moved. When we moved them, we overlooked this detail.

  So, this fix updates the charge element ID in the billing transactions. Now the 'clean' can remove the charge element
  record, then in turn the charge version and licence for the invalid record.
 */

UPDATE water.billing_transactions SET charge_element_id = 'eb118281-0f61-4209-af8c-4006e0861d4d' WHERE charge_element_id = '43e16b42-b91f-4583-bdcc-8451ead22d9a';
