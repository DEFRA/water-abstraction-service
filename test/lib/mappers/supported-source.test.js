'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const SupportedSource = require('../../../src/lib/models/supported-source');

const supportedSourceMapper = require('../../../src/lib/mappers/supported-source');

experiment('lib/mappers/supported-source', () => {
  let result;

  const supportedSourceFromCsv = {
    reference: '1.0.0.0',
    name: 'Some SupportedSource',
    order: 16,
    region: 'Southern'
  };

  experiment('.csvToModel', () => {
    beforeEach(async () => {
      result = supportedSourceMapper.csvToModel(supportedSourceFromCsv);
    });

    test('returns an instance of SupportedSource', async () => {
      expect(result instanceof SupportedSource).to.be.true();
    });

    test('sets the .reference property', async () => {
      expect(result.reference).to.equal(supportedSourceFromCsv.reference);
    });

    test('sets the .name property', async () => {
      expect(result.name).to.equal(supportedSourceFromCsv.name);
    });

    test('sets the .order property', async () => {
      expect(result.order).to.equal(supportedSourceFromCsv.order);
    });

    test('sets the .region property', async () => {
      expect(result.region).to.equal(supportedSourceFromCsv.region);
    });

    experiment('when the name is longer than 255 chars', () => {
      test('the name is truncated to 255 chars', async () => {
        const name = new Array(300).join('A');
        supportedSourceFromCsv.name = name;
        result = supportedSourceMapper.csvToModel(supportedSourceFromCsv);
        const expectedName = name.substr(0, 252) + '...';
        expect(result.name).to.equal(expectedName);
      });
    });

    experiment('when the region is longer than 255 chars', () => {
      test('the region is truncated to 255 chars', async () => {
        const region = new Array(300).join('A');
        supportedSourceFromCsv.region = region;
        result = supportedSourceMapper.csvToModel(supportedSourceFromCsv);
        const expectedRegion = region.substr(0, 252) + '...';
        expect(result.region).to.equal(expectedRegion);
      });
    });
  });
});
