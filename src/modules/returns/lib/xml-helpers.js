const fs = require('fs');
const libxmljs = require('libxmljs');
const util = require('util');
const path = require('path');

const readFile = util.promisify(fs.readFile);

const parseXmlFile = (xmlToParse) => {
  return libxmljs.parseXml(xmlToParse);
};

const getSchemaDoc = async () => {
  const schema = await readFile(path.join(__dirname, '../xml-returns-schema.xsd'), 'utf-8');
  return libxmljs.parseXml(schema);
};

module.exports.parseXmlFile = parseXmlFile;
module.exports.getSchemaDoc = getSchemaDoc;
