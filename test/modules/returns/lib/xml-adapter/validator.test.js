const { expect } = require('@hapi/code')
const { beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script()
const { validateXml } = require('../../../../../src/modules/returns/lib/xml-adapter/validator')
const path = require('path')
const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)

experiment('XSD Validation', () => {
  test('Returns true for passing XML', async () => {
    const xmlStr = await readFile(path.join(__dirname, '../xml-files-for-tests/weekly-return-pass.xml'), 'utf-8')
    const result = await validateXml(xmlStr)
    expect(result.isValid).to.equal(true)
  })

  experiment('Failing XML', () => {
    let failingValidation

    beforeEach(async () => {
      const xmlStr = await readFile(path.join(__dirname, '../xml-files-for-tests/schema-validation-fail.xml'), 'utf-8')
      failingValidation = await validateXml(xmlStr)
    })

    test('Returns list of errors for failing XML', () => {
      expect(failingValidation.isValid).not.to.equal(true)
      expect(failingValidation.validationErrors).to.be.an.array()
    })

    test('Failing XML Errors contain message and line', () => {
      expect(failingValidation.validationErrors).to.have.length(3)
      expect(failingValidation.validationErrors[0]).to.be.an.object().and.contain(['message', 'line'])
      expect(failingValidation.validationErrors[1]).to.be.an.object().and.contain(['message', 'line'])
      expect(failingValidation.validationErrors[2]).to.be.an.object().and.contain(['message', 'line'])
    })
  })
})
