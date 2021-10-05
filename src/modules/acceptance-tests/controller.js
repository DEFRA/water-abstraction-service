'use strict';
const Boom = require('@hapi/boom');
const bluebird = require('bluebird');

const tearDownService = require('./lib/tear-down');

const setLoader = require('../../../integration-tests/billing/services/loader');

const postSetupFromYaml = async (request, h) => {
  try {
    const { key } = request.params;
    const set = require('../../../integration-tests/billing/fixtures/sets.json');

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
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const postTearDown = async () => {
  console.log('Tearing down data');
  await tearDownService.tearDown();
  return 'Tear down complete';
};

exports.postSetupFromYaml = postSetupFromYaml;
exports.postTearDown = postTearDown;
