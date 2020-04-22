'use strict';

const { ApplicationState } = require('../bookshelf');
const mapModel = model => model ? model.toJSON() : null;

const create = (applicationStateId, data) =>
  ApplicationState
    .forge({ applicationStateId })
    .save(data);

const findOne = async applicationStateId => {
  const model = await ApplicationState
    .forge({ applicationStateId })
    .fetch();

  return mapModel(model);
};

exports.create = create;
exports.findOne = findOne;
