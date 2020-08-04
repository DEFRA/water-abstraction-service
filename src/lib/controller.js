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

exports.getEntity = getEntity;
