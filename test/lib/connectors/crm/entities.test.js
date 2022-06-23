const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const entitiesConnector = require('../../../../src/lib/connectors/crm/entities')
const config = require('../../../../config')
const helpers = require('@envage/water-abstraction-helpers')

experiment('lib/connectors/crm/entities', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({})
    sandbox.stub(serviceRequest, 'post').resolves({})
    sandbox.stub(serviceRequest, 'delete').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getEntityCompanies', () => {
    test('passes the expected URL to the request', async () => {
      await entitiesConnector.getEntityCompanies('test-id')
      const expectedUrl = `${config.services.crm}/entity/test-id/companies`
      const arg = serviceRequest.get.args[0][0]
      expect(arg).to.equal(expectedUrl)
    })
  })

  experiment('.getEntityVerifications', () => {
    test('passes the expected URL to the request', async () => {
      await entitiesConnector.getEntityVerifications('test-id')
      const expectedUrl = `${config.services.crm}/entity/test-id/verifications`
      const arg = serviceRequest.get.args[0][0]
      expect(arg).to.equal(expectedUrl)
    })
  })

  experiment('.getEntity', () => {
    test('passes the expected URL to the request', async () => {
      await entitiesConnector.getEntity('test@example.com')
      const expected = `${config.services.crm}/entity?filter={"entity_nm":"test@example.com","entity_type":"individual"}`
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal(expected)
    })

    test('can override the entity_type', async () => {
      await entitiesConnector.getEntity('test@example.com', 'company')
      const expected = `${config.services.crm}/entity?filter={"entity_nm":"test@example.com","entity_type":"company"}`
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal(expected)
    })

    test('returns undefined when no result', async () => {
      serviceRequest.get.resolves({
        data: [],
        error: null,
        pagination: {
          page: 1,
          perPage: 100,
          totalRows: 0,
          pageCount: 0
        }
      })

      const user = await entitiesConnector.getEntity('nope@example.com')
      expect(user).to.be.undefined()
    })

    test('returns the entity when a result is found', async () => {
      serviceRequest.get.resolves({
        data: [
          {
            entity_id: '6d08d734-5fe7-4e27-90b6-414eb60c82bd',
            entity_nm: 'found@example.com',
            entity_type: 'individual'
          }
        ],
        error: null,
        pagination: {
          page: 1,
          perPage: 100,
          totalRows: 1,
          pageCount: 1
        }
      })

      const user = await entitiesConnector.getEntity('found@example.com')
      expect(user.entity_nm).to.equal('found@example.com')
    })
  })

  experiment('.createEntity', () => {
    test('passes the expected URL to the request', async () => {
      await entitiesConnector.createEntity('test@example.com')
      const expected = `${config.services.crm}/entity`
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal(expected)
    })

    test('passes the expected data to the URL', async () => {
      await entitiesConnector.createEntity('test@example.com')
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body).to.equal({
        entity_nm: 'test@example.com',
        entity_type: 'individual'
      })
    })

    test('can override the entity_type', async () => {
      await entitiesConnector.createEntity('test@example.com', 'company')
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body).to.equal({
        entity_nm: 'test@example.com',
        entity_type: 'company'
      })
    })

    test('will include the source if provied', async () => {
      await entitiesConnector.createEntity('test@example.com', 'company', 'test-source')
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body).to.equal({
        entity_nm: 'test@example.com',
        entity_type: 'company',
        source: 'test-source'
      })
    })

    test('returns the created entity', async () => {
      serviceRequest.post.resolves({
        data: {
          entity_id: '00000000-0000-0000-0000-000000000000',
          entity_nm: 'test@example.com',
          entity_type: 'individual',
          created_at: '2019-08-01T12:44:46.000Z'
        },
        error: null
      })

      const user = await entitiesConnector.createEntity('test@example.com')
      expect(user.entity_nm).to.equal('test@example.com')
    })
  })

  experiment('.createAdminEntityRole', () => {
    test('passes the expected URL to the request', async () => {
      const entityId = '00000000-0000-0000-0000-000000000000'
      const createdBy = 'test@example.com'
      await entitiesConnector.createAdminEntityRole(entityId, createdBy)
      const expected = `${config.services.crm}/entity/${entityId}/roles`
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal(expected)
    })

    test('passes the expected data', async () => {
      const entityId = '00000000-0000-0000-0000-000000000000'
      const createdBy = 'test@example.com'
      await entitiesConnector.createAdminEntityRole(entityId, createdBy)
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body).to.equal({
        role: 'admin',
        regime_entity_id: config.crm.waterRegime,
        created_by: createdBy
      })
    })

    test('returns the created entity role', async () => {
      const entityId = '00000000-0000-0000-0000-000000000000'
      const createdBy = 'test@example.com'

      serviceRequest.post.resolves({
        data: {
          entity_role_id: '11111111-1111-1111-1111-111111111111',
          entity_id: entityId,
          role: 'admin',
          regime_entity_id: '22222222-2222-2222-2222-222222222222',
          company_entity_id: null,
          created_at: '2019-08-01T13:18:32.564Z',
          created_by: createdBy
        },
        error: null
      })
      const role = await entitiesConnector.createAdminEntityRole(entityId, createdBy)
      expect(role.role).to.equal('admin')
      expect(role.entity_id).to.equal(entityId)
      expect(role.created_by).to.equal(createdBy)
    })
  })

  experiment('.getOrCreateInternalUserEntity', () => {
    experiment('when the entity already exists', () => {
      let entity

      beforeEach(async () => {
        serviceRequest.get.resolves({
          data: [
            {
              entity_id: '00000000-0000-0000-0000-000000000000',
              entity_nm: 'test@example.gov.uk',
              entity_type: 'individual',
              entity_definition: null,
              source: null,
              created_at: null,
              updated_at: null
            }
          ]
        })

        entity = await entitiesConnector.getOrCreateInternalUserEntity('test@example.com', 'admin@example.com')
      })

      test('the entity is returned', async () => {
        expect(entity.entity_id).to.equal('00000000-0000-0000-0000-000000000000')
        expect(entity.entity_nm).to.equal('test@example.gov.uk')
        expect(entity.entity_type).to.equal('individual')
        expect(entity.entity_definition).to.be.null()
        expect(entity.source).to.be.null()
        expect(entity.created_at).to.be.null()
        expect(entity.updated_at).to.be.null()
      })

      test('no call is made to create a new entity or role', async () => {
        expect(serviceRequest.post.called).to.be.false()
      })
    })

    experiment('when the entity does not already exist', () => {
      let entity
      let newEntityId

      beforeEach(async () => {
        newEntityId = '00000000-0000-0000-0000-000000000000'
        serviceRequest.get.resolves({
          data: [],
          error: null
        })

        serviceRequest.post.onFirstCall().resolves({
          data: {
            entity_id: newEntityId,
            entity_nm: 'test@example.com',
            entity_type: 'individual'
          }
        })

        serviceRequest.post.onSecondCall().resolves({
          data: {
            entity_role_id: '11111111-1111-1111-1111-111111111111',
            entity_id: newEntityId,
            role: 'admin',
            regime_entity_id: '22222222-2222-2222-2222-222222222222',
            company_entity_id: null,
            created_at: '2019-08-01T13:18:32.564Z',
            created_by: 'admin@example.com'
          }
        })

        entity = await entitiesConnector.getOrCreateInternalUserEntity('test@example.com', 'admin@example.com')
      })

      test('a new entity is created', async () => {
        const [, options] = serviceRequest.post.firstCall.args
        expect(options.body.entity_nm).to.equal('test@example.com')
        expect(options.body.entity_type).to.equal('individual')
      })

      test('the new entity is used when creating the role', async () => {
        const [, options] = serviceRequest.post.secondCall.args
        expect(options.body.role).to.equal('admin')
        expect(options.body.regime_entity_id).to.equal(config.crm.waterRegime)
        expect(options.body.created_by).to.equal('admin@example.com')
      })

      test('the new entity is returned', async () => {
        expect(entity.entity_id).to.equal(newEntityId)
        expect(entity.entity_nm).to.equal('test@example.com')
        expect(entity.entity_type).to.equal('individual')
      })
    })
  })

  experiment('.deleteAcceptanceTestData', () => {
    test('makes a delete request to the expected url', async () => {
      await entitiesConnector.deleteAcceptanceTestData()

      const [url] = serviceRequest.delete.lastCall.args
      expect(url).to.equal(`${config.services.crm}/acceptance-tests/entities`)
    })
  })
})

experiment('updateEntityEmail', () => {
  const entityId = 'entity-1'
  const email = 'mail@example.com'

  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'patch').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('passes the expected URL to the request', async () => {
    await entitiesConnector.updateEntityEmail(entityId, email)
    const [url, options] = helpers.serviceRequest.patch.lastCall.args
    expect(url).to.equal(`${process.env.CRM_URI}/entity/${entityId}`)
    expect(options).to.equal({
      body: {
        entity_nm: email
      }
    })
  })
})
