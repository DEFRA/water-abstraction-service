/**
 * See https://environment.data.gov.uk/flood-monitoring/doc/reference#individual-station
 */

const Lab = require('lab');
const lab = Lab.script();
const { expect } = require('code');

const { stationIsActive } = require('../../../src/modules/river-levels/api-mappers.js');

lab.experiment('Test stationIsActive', () => {
  lab.test('If the status parameter is not present, station should be considered active', async () => {
    const stationData = {
    };
    const active = stationIsActive(stationData);
    expect(active).to.equal(true);
  });

  lab.test('If the status is active, station is active', async () => {
    const stationData = {
      items: {
        status: 'http://environment.data.gov.uk/flood-monitoring/def/core/statusActive'
      }
    };
    const active = stationIsActive(stationData);
    expect(active).to.equal(true);
  });

  lab.test('If the status is not active, returns false', async () => {
    const stationData = {
      items: {
        status: 'http://environment.data.gov.uk/flood-monitoring/def/core/rt:statusSuspended'
      }
    };
    const active = stationIsActive(stationData);
    expect(active).to.equal(false);
  });
});

exports.lab = lab;
