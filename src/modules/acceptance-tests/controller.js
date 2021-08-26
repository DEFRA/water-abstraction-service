'use strict';

const Boom = require('@hapi/boom');
const bluebird = require('bluebird');
const integrationTests = require('../../../integration-tests/billing/services/tear-down');
const setLoader = require('../../../integration-tests/billing/services/loader');
const set = require('../../../integration-tests/billing/fixtures/sets.json');

const postSetupFromYaml = async (request, h) => {
  const { key } = request.params;
  if (!set[key]) {
    return Boom.notFound(`Key ${key} did not match any available Yaml sets.`);
  }

  // Create a set loader
  const loader = setLoader.createSetLoader();

  // Load YAML files in series
  await bluebird.mapSeries(set[key],
    ({ service, file }) => loader.load(service, file)
  );

  return h.response().code(204);
};

const postTearDown = async () => {
  console.log('Tearing down started');
  await integrationTests.tearDown();
  return 'tear down complete';
};

exports.postSetupFromYaml = postSetupFromYaml;
exports.postTearDown = postTearDown;
