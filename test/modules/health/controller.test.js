const { test, experiment, before } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const controller = require('../../../src/modules/health/controller')
const pkg = require('../../../package.json')

experiment('modules/service-status/controller', () => {
  experiment('.getStatus', () => {
    let status

    before(async () => {
      status = await controller.getStatus()
    })

    test('contains the expected water service version', async () => {
      expect(status.version).to.equal(pkg.version)
    })

    test('contains the git commit hash', async () => {
      expect(status.commit).to.exist()
    })
  })
})
