exports.deleteLicenceAgreements = `delete FROM water.licence_agreements a
join water.licences l on a.licence_ref =l.licence_ref 
where l.is_test is true;`;
