'use strict';

const Boom = require('@hapi/boom');

/**
 * Gets an entity via a service layer function, and either returns it if present,
 * or returns a Not Found error object. Suitable in simple controller handlers
 * where no extra logic is applied.
 *
 * @param {*} id
 * @param {Function} serviceFunc The service layer function that will retrieve the entity
 */
const getEntity = async (id, serviceFunc) => {
  const entity = await serviceFunc(id);
  return entity || Boom.notFound(`Entity ${id} not found`, { id });
};

/**
 * Gets an array of entities via a service layer function, and returns
 * the array of results in a data envelope. Suitable in simple controller
 * handlers where no extra logic is applied.
 *
 * @param {*} id
 * @param {Function} serviceFunc The service layer function that will retrieve the array of entities
 */
const getEntities = async (id, serviceFunc) => {
  const entities = await serviceFunc(id);
  return { data: entities };
};

exports.getEntities = getEntities;
exports.getEntity = getEntity;
