'use strict'

/**
 * If the error is a 409 and there is an existing entity
 * return this entity.
 * Else re-throw the error
 * @param {Error} err
 * @return {Object} existingEntity
 */
const getExistingEntity = err => {
  if (err.statusCode === 409 && err.error.existingEntity) {
    return err.error.existingEntity
  }
  throw err
}

exports.getExistingEntity = getExistingEntity
