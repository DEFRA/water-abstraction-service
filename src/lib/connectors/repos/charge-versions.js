const { ChargeVersion } = require('../bookshelf');

const findOne = async (id) => {
  const model = await ChargeVersion
    .forge({ chargeVersionId: id })
    .fetch({
      withRelated: [
        'chargeElements',
        'chargeElements.purposePrimary',
        'chargeElements.purposeSecondary',
        'chargeElements.purposeUse',
        'licence',
        'licence.region',
        'licence.licenceAgreements'
      ]
    });

  return model.toJSON();
};

exports.findOne = findOne;
