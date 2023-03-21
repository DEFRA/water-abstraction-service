const urlJoin = require('url-join')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')
const helpers = require('@envage/water-abstraction-helpers')
const { partialRight } = require('../../../lib/object-helpers.js')

const getEntityContent = async (entityId, pathTail) => {
  const url = `${config.services.crm}/entity/${entityId}/${pathTail}`
  return serviceRequest.get(url)
}

const getEntityCompanies = partialRight(getEntityContent, 'companies')

const getEntityVerifications = partialRight(getEntityContent, 'verifications')

/**
 * update CRM db row for entity with new email for entity_nm
 */
const updateEntityEmail = async (entityId, newEmail) => {
  return helpers.serviceRequest.patch(`${process.env.CRM_URI}/entity/${entityId}`, {
    body: {
      entity_nm: newEmail
    }
  })
}

/** Gets an entity from the CRM. Returns only the entity and does
 * not include the response envelope.
 *
 * @param {String} name The name (or email) of the entity to find
 * @param {String} type The type of entity to find (individual|company|regime)
 */
const getEntity = async (name, type = 'individual') => {
  const filter = JSON.stringify({
    entity_nm: name,
    entity_type: type
  })

  const url = `${config.services.crm}/entity?filter=${filter}`
  const response = await serviceRequest.get(url)

  return response.data?.[0]
}

/**
 * Create a new entity in the CRM
 * Returns the created entity without the response envelope.
 *
 * @param {String} name The name or email address of the entity to create
 * @param {String} type The entity type (individual|company|regime)
 * @param {String} source The source of the user (used in acceptance tests data creation)
 */
const createEntity = async (name, type = 'individual', source) => {
  const url = `${config.services.crm}/entity`
  const body = {
    entity_nm: name,
    entity_type: type
  }

  if (source) {
    body.source = source
  }

  const response = await serviceRequest.post(url, { body })
  return response.data
}

/**
 * Create a new entity in the CRM
 * Returns the created entity without the response envelope.
 *
 * @param {String} name The name or email address of the entity to create
 * @param {String} type The entity type (individual|company|regime)
 */
const createEntityRole = async (entityId, role, createdBy, companyEntityId = null, regimeEntityId = null) => {
  const url = `${config.services.crm}/entity/${entityId}/roles`
  const body = {
    role,
    created_by: createdBy
  }

  if (companyEntityId) {
    body.company_entity_id = companyEntityId
  }

  if (regimeEntityId) {
    body.regime_entity_id = regimeEntityId
  }

  const response = await serviceRequest.post(url, { body })
  return response.data
}

const createAdminEntityRole = (entityId, createdBy) => {
  return createEntityRole(entityId, 'admin', createdBy, null, config.crm.waterRegime)
}

/**
 * Ensures that an entity exists in the CRM for the given email address
 *
 * @param {String} newUserEmail The email address of the new entity
 * @param {String} callingUserEmail The email address of the user who is creating the new user
 */
const getOrCreateInternalUserEntity = async (newUserEmail, callingUserEmail) => {
  const existingEntity = await getEntity(newUserEmail)

  if (existingEntity) {
    return existingEntity
  }

  // create a new crm entity
  const newEntity = await createEntity(newUserEmail)

  // then create the entity_role
  await createAdminEntityRole(newEntity.entity_id, callingUserEmail)

  return newEntity
}

exports.getEntity = getEntity
exports.createEntity = createEntity
exports.createEntityRole = createEntityRole
exports.createAdminEntityRole = createAdminEntityRole

exports.getEntityCompanies = getEntityCompanies
exports.getEntityVerifications = getEntityVerifications

exports.getOrCreateInternalUserEntity = getOrCreateInternalUserEntity
exports.updateEntityEmail = updateEntityEmail

if (!config.isProduction) {
  exports.deleteAcceptanceTestData = async () => {
    const CRMV1URL = urlJoin(config.services.crm, 'acceptance-tests/entities')
    const CRMV2URL = urlJoin(config.services.crm_v2, 'test-data')
    await serviceRequest.delete(CRMV2URL)
    return serviceRequest.delete(CRMV1URL)
  }
}
