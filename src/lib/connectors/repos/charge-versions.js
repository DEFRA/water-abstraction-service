const { ChargeVersion } = require('../bookshelf');

const sharedRelations = [
  'chargeElements',
  'chargeElements.purposePrimary',
  'chargeElements.purposeSecondary',
  'chargeElements.purposeUse',
  'licence',
  'licence.region',
  'licence.licenceAgreements',
  'changeReason'
];

const findOne = async chargeVersionId => {
  const model = await ChargeVersion
    .forge({ chargeVersionId })
    .fetch({
      withRelated: sharedRelations
    });

  return model.toJSON();
};

const findByLicenceRef = async licenceRef => {
  const models = await ChargeVersion
    .forge()
    .where('licence_ref', licenceRef)
    .orderBy('start_date')
    .fetchAll({
      withRelated: sharedRelations
    });

  return models.toJSON();
};

const create = async data => {
  const model = await ChargeVersion.forge(data).save();
  return model.toJSON();
};

exports.create = create;
exports.findOne = findOne;
exports.findByLicenceRef = findByLicenceRef;
