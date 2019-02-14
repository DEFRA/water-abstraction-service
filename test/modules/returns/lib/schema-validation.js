const { expect } = require('code');
const { beforeEach, experiment, test } = exports.lab = require('lab').script();
const { parseXmlFile } = require('../../../../src/modules/returns/lib/xml-helpers');
const { validateXml } = require('../../../../src/modules/returns/lib/schema-validation');
const path = require('path');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

experiment('XSD Validation', () => {
  let xmlFileToParse;

  test('Returns true for passing XML', async () => {
    xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/weekly-return-pass.xml'), 'utf-8');
    const xmlFile = parseXmlFile(xmlFileToParse);
    const result = await validateXml(xmlFile);
    expect(result).to.equal(true);
  });

  experiment('Failing XML', () => {
    let xmlFile;
    let failingValdation;

    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/schema-validation-fail.xml'), 'utf-8');
      xmlFile = await parseXmlFile(xmlFileToParse);
      failingValdation = await validateXml(xmlFile);
    });

    test('Returns list of errors for failing XML', () => {
      expect(failingValdation).not.to.equal(true);
      expect(failingValdation).to.be.an.array();
    });

    test('Failing XML Errors contain message and line', () => {
      expect(failingValdation).to.have.length(3);
      expect(failingValdation[0]).to.be.an.object().and.contain(['message', 'line']);
      expect(failingValdation[1]).to.be.an.object().and.contain(['message', 'line']);
      expect(failingValdation[2]).to.be.an.object().and.contain(['message', 'line']);
    });
  });
});
