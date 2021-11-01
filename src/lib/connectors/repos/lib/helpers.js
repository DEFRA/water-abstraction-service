'use strict';
const paginationHelper = require('../lib/envelope');

const findOneBy = async (bookshelfModel, conditions, withRelated = []) => {
  const result = await bookshelfModel
    .forge(conditions)
    .fetch({
      withRelated,
      require: false
    });
  return result && result.toJSON();
};

exports.findOne = async (bookshelfModel, idKey, id, withRelated = []) =>
  findOneBy(bookshelfModel, { [idKey]: id }, withRelated);

exports.findMany = async (bookshelfModel, conditions = {}, withRelated = []) => {
  const result = await bookshelfModel
    .forge()
    .where(conditions)
    .fetchAll({ require: false, withRelated });

  return result.toJSON();
};

exports.findManyWithPaging = async (bookshelfModel, conditions = {}, withRelated = [], page = 1, perPage = 10) => {
  const result = await bookshelfModel
    .forge()
    .where(conditions)
    .where('charge_version_workflow_id', 'is not', null)
    .orderBy('charge_version_workflow_id', 'desc')
    .fetchPage({
      page,
      pageSize: perPage,
      withRelated
    });

  return paginationHelper.paginatedEnvelope(result);
};

exports.create = async (bookShelfModel, data) => {
  const model = await bookShelfModel.forge(data).save();
  return model.toJSON();
};

exports.update = async (bookshelfModel, idKey, id, changes) => {
  const result = await bookshelfModel
    .forge({ [idKey]: id })
    .save(changes);
  return result.toJSON();
};

exports.deleteOne = async (bookShelfModel, idKey, id) => {
  return bookShelfModel
    .forge({ [idKey]: id })
    .destroy();
};

exports.deleteTestData = async (bookShelfModel) => {
  return bookShelfModel.forge().where({ is_test: true }).destroy({
    require: false
  });
};

exports.findOneBy = findOneBy;
