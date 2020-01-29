const { BillingBatch } = require('../bookshelf');

const findOne = async (id) => {
  const model = await new BillingBatch({ billing_batch_id: id })
    .fetch({
      withRelated: [
        'region'
      ]
    });

  return model.toJSON();
}
;

exports.findOne = findOne;
