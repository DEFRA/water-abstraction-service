const { BillingBatch } = require('../bookshelf');
const { paginatedEnvelope } = require('./lib/envelope');

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

const findPage = async (page, pageSize) => {
  const result = await new BillingBatch()
    .orderBy('date_created', 'ASC')
    .fetchPage({
      page,
      pageSize,
      withRelated: [
        'region'
      ]
    });
  return paginatedEnvelope(result);
};

exports.findOne = findOne;
exports.findPage = findPage;
