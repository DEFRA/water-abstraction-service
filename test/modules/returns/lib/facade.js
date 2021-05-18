const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const facade = require('../../../../src/modules/returns/lib/facade');
const apiConnector = require('../../../../src/modules/returns/lib/api-connector');
const naldConnector = require('../../../../src/modules/import/lib/nald-returns-queries');

const regionCode = '1';
const formatId = '1234';
const licenceNumber = '01/123/ABC';
const startDate = '2017-11-01';

const createReturnId = endDate =>
  `v1:${regionCode}:${licenceNumber}:${formatId}:${startDate}:${endDate}`;

const createReturn = endDate => ({
  return_id: createReturnId(endDate),
  start_date: '2017-11-01',
  end_date: endDate,
  returns_frequency: 'month'
});

const createVersions = endDate => [{
  version_id: 'version_1',
  return_id: createReturnId(endDate),
  version_number: 1
}, {
  version_id: 'version_2',
  return_id: createReturnId(endDate),
  version_number: 2
}];

const createLines = () => ([
  {
    line_id: 'line_1',
    version_id: 'version_1',
    quantity: 123
  }, {
    line_id: 'line_2',
    version_id: 'version_2',
    quantity: 456
  }
]);

const createNaldLines = units => ([
  {
    UNIT_RET_FLAG: units,
    RET_DATE: '20171130000000',
    ARFL_ARTY_ID: 'format_1',
    ARFL_DATE_FROM: '20171101000000',
    RET_QTY: 100.13,
    RET_QTY_USABILITY: 'M'
  }
]);

experiment('modules/returns/lib/facade', () => {
  let data, result;

  beforeEach(async () => {
    sandbox.stub(apiConnector, 'fetchReturn');
    sandbox.stub(apiConnector, 'fetchVersion');
    sandbox.stub(apiConnector, 'fetchAllVersions');
    sandbox.stub(apiConnector, 'fetchLines');
    sandbox.stub(naldConnector, 'isNilReturn');
    sandbox.stub(naldConnector, 'getLines');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturnData', () => {
    experiment('when the return is a service return ending on 2018-10-31 or later', () => {
      beforeEach(async () => {
        data = {
          versionNumber: 1,
          returnId: createReturnId('2018-10-31'),
          return: createReturn('2018-10-31'),
          versions: createVersions('2018-10-31'),
          lines: createLines()
        };

        apiConnector.fetchReturn.resolves(data.return);
        apiConnector.fetchVersion.resolves(data.versions[0]);
        apiConnector.fetchAllVersions.resolves(data.versions);
        apiConnector.fetchLines.resolves(data.lines);

        result = await facade.getReturnData(data.returnId, data.versionNumber);
      });

      test('apiConnector.fetchReturn is called with the correct return ID', async () => {
        expect(apiConnector.fetchReturn.calledWith(
          data.returnId
        )).to.be.true();
      });

      test('apiConnector.fetchVersion is called with the correct return ID and version number', async () => {
        expect(apiConnector.fetchVersion.calledWith(
          data.returnId, data.versionNumber
        )).to.be.true();
      });

      test('apiConnector.fetchLines is called with the correct return ID and version ID', async () => {
        expect(apiConnector.fetchLines.calledWith(
          data.returnId, data.versions[0].version_id
        )).to.be.true();
      });

      test('apiConnector.fetchAllVersions is called with the correct return ID', async () => {
        expect(apiConnector.fetchAllVersions.calledWith(
          data.returnId
        )).to.be.true();
      });

      test('the function resolves with the collected data', async () => {
        expect(result.return).to.equal(data.return);
        expect(result.version).to.equal(data.versions[0]);
        expect(result.versions).to.equal(data.versions);
        expect(result.lines).to.equal(data.lines);
      });
    });

    experiment('when the return is a service return ending on 2018-10-31 or later but has no version', () => {
      beforeEach(async () => {
        data = {
          versionNumber: 1,
          returnId: createReturnId('2018-10-31'),
          return: createReturn('2018-10-31'),
          versions: createVersions('2018-10-31'),
          lines: createLines()
        };

        apiConnector.fetchReturn.resolves(data.return);
        apiConnector.fetchVersion.resolves();
        apiConnector.fetchAllVersions.resolves([]);
        apiConnector.fetchLines.resolves(data.lines);

        result = await facade.getReturnData(data.returnId, data.versionNumber);
      });

      test('apiConnector.fetchLines is never called', async () => {
        expect(apiConnector.fetchLines.called).to.be.false();
      });

      test('the function resolves with the collected data', async () => {
        expect(result.return).to.equal(data.return);
        expect(result.version).to.equal(undefined);
        expect(result.versions).to.equal([]);
        expect(result.lines).to.equal([]);
      });
    });

    experiment('when the return is a non-nil, metric, NALD return', () => {
      beforeEach(async () => {
        data = {
          versionNumber: 1,
          returnId: createReturnId('2018-10-30'),
          return: createReturn('2018-10-30'),
          lines: createNaldLines('M')
        };

        apiConnector.fetchReturn.resolves(data.return);
        naldConnector.isNilReturn.resolves(false);
        naldConnector.getLines.resolves(data.lines);

        result = await facade.getReturnData(data.returnId, data.versionNumber);
      });

      test('naldConnector.isNilReturn is called with the correct parameters', async () => {
        const { args } = naldConnector.isNilReturn.lastCall;
        expect(args[0]).to.equal(formatId);
        expect(args[1]).to.equal(regionCode);
        expect(args[2]).to.equal(startDate);
        expect(args[3]).to.equal('2018-10-30');
      });

      test('naldConnector.getLines is called with the correct parameters', async () => {
        const { args } = naldConnector.getLines.lastCall;
        expect(args[0]).to.equal(formatId);
        expect(args[1]).to.equal(regionCode);
        expect(args[2]).to.equal(startDate);
        expect(args[3]).to.equal('2018-10-30');
      });

      test('the function resolves with the collected data', async () => {
        expect(result.return).to.equal(data.return);
        expect(result.version).to.be.an.object();
        expect(result.versions).to.be.an.array().length(1);
        expect(result.lines).to.be.an.array().length(1);
      });

      test('the version number is always 1', async () => {
        expect(result.version.version_number).to.equal(1);
      });

      test('the version nil_return flag is false', async () => {
        expect(result.version.nil_return).to.be.false();
      });

      test('the version units are read from the first return line', async () => {
        expect(result.version.metadata.units).to.equal('m³');
      });

      test('the version current version flag is set to true', async () => {
        expect(result.version.current).to.equal(true);
      });

      test('the line has the correct units', async () => {
        expect(result.lines[0].unit).to.equal('m³');
        expect(result.lines[0].user_unit).to.equal('m³');
      });

      test('the line has the correct dates', async () => {
        expect(result.lines[0].start_date).to.equal('2017-11-01');
        expect(result.lines[0].end_date).to.equal('2017-11-30');
      });

      test('the line has the correct quantity', async () => {
        expect(result.lines[0].quantity).to.equal(data.lines[0].RET_QTY);
      });

      test('the line has the correct reading type', async () => {
        expect(result.lines[0].reading_type).to.equal('measured');
      });
    });

    experiment('when the return is a nil NALD return', () => {
      beforeEach(async () => {
        data = {
          versionNumber: 1,
          returnId: createReturnId('2018-10-30'),
          return: createReturn('2018-10-30'),
          lines: createNaldLines('M')
        };

        apiConnector.fetchReturn.resolves(data.return);
        naldConnector.isNilReturn.resolves(true);
        naldConnector.getLines.resolves(data.lines);

        result = await facade.getReturnData(data.returnId, data.versionNumber);
      });

      test('the version number is always 1', async () => {
        expect(result.version.version_number).to.equal(1);
      });

      test('the version nil_return flag is true', async () => {
        expect(result.version.nil_return).to.be.true();
      });

      test('the lines array is empty', async () => {
        expect(result.lines).to.equal([]);
      });
    });
    experiment('when the return is a non-nil, gallons, NALD return', () => {
      beforeEach(async () => {
        data = {
          versionNumber: 1,
          returnId: createReturnId('2018-10-30'),
          return: createReturn('2018-10-30'),
          lines: createNaldLines('I')
        };

        apiConnector.fetchReturn.resolves(data.return);
        naldConnector.isNilReturn.resolves(false);
        naldConnector.getLines.resolves(data.lines);

        result = await facade.getReturnData(data.returnId, data.versionNumber);
      });

      test('the version units are read from the first return line', async () => {
        expect(result.version.metadata.units).to.equal('gal');
      });

      test('the line has the correct units', async () => {
        expect(result.lines[0].unit).to.equal('m³');
        expect(result.lines[0].user_unit).to.equal('gal');
      });
    });
  });
});
