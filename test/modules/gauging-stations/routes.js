const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const routes = require('../../../src/modules/gauging-stations/routes');
const controllers = require('../../../src/modules/gauging-stations/controller');

experiment('.getGaugingStation', () => {
  test('it has the right method', () => {
    expect(routes.getGaugingStation.method).to.equal('GET');
  });
  test('it calls the right controller', () => {
    expect(routes.getGaugingStation.handler).to.equal(controllers.getGaugingStation);
  });
  test('it has the right path', () => {
    expect(routes.getGaugingStation.path).to.equal('/water/1.0/gauging-stations/{stationGuid}');
  });
});
