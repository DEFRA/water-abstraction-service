'use strict';

/**
 * purposePrimary, purposeSecondary and purposeUse are left in
 * a more readable format but need to be replaced with references to
 * the entries in the tables when the charge element is saved.
 *
 * e.g. purpose_primary_id, purpose_secondary_id and purpose_use_id
 */

exports.ce1 = {
  abstractionPeriodStartDay : 1,
  abstractionPeriodStartMonth : 4,
  abstractionPeriodEndDay : 31,
  abstractionPeriodEndMonth : 3,
  authorisedAnnualQuantity : 50,
  billableAnnualQuantity : 50,
  season : 'summer',
  seasonDerived: 'summer',
  source : 'unsupported',
  loss : 'low',
  purposePrimary : 'A',
  purposeSecondary : 'AGR',
  purposeUse : 140,
  description : 'CE1',
  factorsOverridden : false
};

// Spray Irrigation charge element
exports.ce2 = {
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 4,
  abstractionPeriodEndDay: 31,
  abstractionPeriodEndMonth: 10,
  authorisedAnnualQuantity: 25,
  billableAnnualQuantity: 25,
  season: 'summer',
  seasonDerived: 'summer',
  source: 'unsupported',
  loss: 'high',
  purposePrimary: 'A',
  purposeSecondary: 'AGR',
  purposeUse: 400,
  description: 'CE2',
  factorsOverridden: false
};

exports.ce3 = {
  abstractionPeriodStartDay : 1,
  abstractionPeriodStartMonth : 4,
  abstractionPeriodEndDay : 31,
  abstractionPeriodEndMonth : 3,
  authorisedAnnualQuantity : 50,
  billableAnnualQuantity : 25,
  season : 'all year',
  seasonDerived: 'all year',
  source : 'unsupported',
  loss : 'low',
  purposePrimary : 'A',
  purposeSecondary : 'AGR',
  purposeUse : 140,
  description : 'CE3',
  factorsOverridden : false
};

exports.ce4 = Object.assign({}, exports.ce3, { billableAnnualQuantity: 50, description: 'CE4' })

exports.ce5 = {
  abstractionPeriodStartDay : 1,
  abstractionPeriodStartMonth : 11,
  abstractionPeriodEndDay : 31,
  abstractionPeriodEndMonth : 3,
  authorisedAnnualQuantity : 50,
  billableAnnualQuantity : 50,
  season : 'winter',
  seasonDerived: 'all year',
  source : 'unsupported',
  loss : 'high',
  purposePrimary : 'A',
  purposeSecondary : 'AGR',
  purposeUse : 420,
  description : 'CE5',
  factorsOverridden : false
};
