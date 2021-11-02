'use strict';

/**
 * Helper function to abstract the process of retrieving a single item
 * via a repository and mapping the result to a model if any data was returned
 *
 * @param {String} id
 * @param {Function} fetchDataFunc The function that is used to get the data
 * @param {Object} mapper The object containing the dbToModel mapping function
 */
const findOne = async (id, fetchDataFunc, mapper) => {
  const data = await fetchDataFunc(id);
  return data && mapper.dbToModel(data);
};

/**
 * Helper function to abstract the process of retrieving multiple items
 * via a repository and mapping the results to models.
 *
 * @param {String} id
 * @param {Function} fetchDataFunc The function that is used to get the data
 * @param {Object} mapper The object containing the dbToModel mapping function
 */
const findMany = async (id, fetchDataFunc, mapper) => {
  const data = await fetchDataFunc(id);
  return data.map(mapper.dbToModel);
};

/**
 * Helper function to abstract the process of retrieving all items
 * via a repository and mapping the results to models.
 *
 * @param {Function} fetchDataFunc The function that is used to get the data
 * @param {Object} mapper The object containing the dbToModel mapping function
 */
const findAll = async (fetchDataFunc, mapper) => {
  const data = await fetchDataFunc();
  return data.map(mapper.dbToModel);
};

const findAllWithPaging = async (fetchDataFunc, mapper, page, perPage, tabFilter) => {
  const data = await fetchDataFunc(page, perPage, tabFilter);
  return data.map(mapper.dbToModel);
};

exports.findOne = findOne;
exports.findMany = findMany;
exports.findAll = findAll;
exports.findAllWithPaging = findAllWithPaging;
