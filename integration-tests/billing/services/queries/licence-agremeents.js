exports.deleteLicenceAgreements = `delete FROM water.licence_agreements where licence_agreements.licence_ref IN 
  (select licence_ref from water.licences WHERE is_test = true)`
