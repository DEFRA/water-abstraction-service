'use strict';
const Boom = require('@hapi/boom');
const bluebird = require('bluebird');

const tearDownService = require('./lib/tear-down');

const setLoader = require('../../../integration-tests/billing/services/loader');
const set = require('../../../integration-tests/billing/fixtures/sets.json');

const createYamlSet = (key) => {
  // If any entries in a yaml set specified by the key contain repeat entries then flatten each repeated entry so the set has no repeated entries.
  //
  // A single entry is of the form:
  //     {
  //       "service": "water",
  //       "file": "test-file.yaml",
  //       "config": {
  //          "foo": "bar"
  //       }
  //     },
  //
  // A repeated entry can contain a repeated set and is of the form:
  //     {
  //       "repeat": {
  //          "count": 2,
  //          "data": [
  //             {
  //               "service": "water",
  //               "file": "test-file-1.yaml",
  //               "config": {
  //                  "foo": "bar"
  //               }
  //             },
  //             {
  //               "service": "water",
  //               "file": "test-file-2.yaml",
  //               "config": {
  //                  "bar": "foo"
  //               }
  //             }
  //          ]
  //       }
  //     },
  //
  // The repeated entry above will generate the following 2 entries as the count is specified as 2
  //     {
  //       "service": "water",
  //       "file": "test-file-1.yaml",
  //       "config": {
  //          "index": 0,
  //          "foo": "bar"
  //       }
  //     },
  //     {
  //       "service": "water",
  //       "file": "test-file-2.yaml",
  //       "config": {
  //          "index": 0,
  //          "bar": "foo"
  //       }
  //     },
  //     {
  //       "service": "water",
  //       "file": "test-file-1.yaml",
  //       "config": {
  //          "index": 1,
  //          "foo": "bar"
  //       }
  //     },
  //     {
  //       "service": "water",
  //       "file": "test-file-2.yaml",
  //       "config": {
  //          "index": 1,
  //          "bar": "foo"
  //       }
  //     },
  //
  const singleEntries = set[key].filter(({ repeat }) => !repeat);
  const repeatedEntries = set[key].filter(({ repeat }) => !!repeat).flatMap((yamlEntry) => {
    const { count, data } = yamlEntry.repeat;
    return (new Array(count).fill([...data])).flatMap((dataSet, index) => {
      return dataSet.map((dataEntry) => {
        const { config = {} } = dataEntry;
        return ({ ...dataEntry, config: { ...config, index } });
      });
    });
  });
  return [...singleEntries, ...repeatedEntries];
};

const postSetupFromYaml = async (request, h) => {
  try {
    const { key } = request.params;

    if (!set[key]) {
      return Boom.notFound(`Key ${key} did not match any available Yaml sets.`);
    }

    if (!Array.isArray(set[key])) {
      return Boom.badData(`Key ${key} did not find valid Yaml sets.`);
    }

    // Create a set loader
    const loader = setLoader.createSetLoader();
    // Load YAML files in series
    await bluebird.mapSeries(createYamlSet(key),
      ({ service, file, config }) => loader.load(service, file, config)
    );

    return h.response().code(204);
  } catch (e) {
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
