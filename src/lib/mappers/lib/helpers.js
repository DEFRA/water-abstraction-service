'use strict';

/**
 * Convenience function to create a new service model of the supplied class,
 * using the data mapped via the supplied mapper.
 * The mapper is an instance of the map-factory NPM module
 * @param {Class} ModelClass
 * @param {Object} data
 * @param {Object} mapper
 * @return {Object}
 */
const createModel = (ModelClass, data, mapper, mapNull = false) => {
  if (!data && mapNull) return null;
  const model = new ModelClass();
  return model.fromHash(
    mapper.execute(data)
  );
};

exports.createModel = createModel;
