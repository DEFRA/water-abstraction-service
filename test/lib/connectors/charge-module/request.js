'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const config = require('../../../../config.js');
const request = require('../../../../src/lib/connectors/charge-module/request');

experiment('lib/connectors/charge-module/request', () => {
  beforeEach(async () => {
    sandbox.stub(request.cmRequest, 'get').resolves();
    sandbox.stub(request.cmRequest, 'post').resolves();
    sandbox.stub(request.cmRequest, 'patch').resolves();

    sandbox.stub(config.services, 'chargeModule').value('https://test.example.com');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.get', () => {
    experiment('for a request with a path only', () => {
      let options;

      beforeEach(async () => {
        await request.get('path/to/somewhere');
        options = request.cmRequest.get.lastCall.args[0];
      });

      test('the options object has json set to true', async () => {
        expect(options.json).to.be.true();
      });

      test('the options object has the correct URL', async () => {
        expect(options.uri).to.equal('https://test.example.com/path/to/somewhere');
      });

      test('there is no qs value due to no query params being passed', async () => {
        expect(options).not.to.include('qs');
      });
    });

    experiment('for a request with a path and query params', () => {
      let options;

      beforeEach(async () => {
        await request.get('path/to/somewhere', {
          one: 1,
          two: 2
        });
        options = request.cmRequest.get.lastCall.args[0];
      });

      test('the options object has json set to true', async () => {
        expect(options.json).to.be.true();
      });

      test('the options object has the correct URL', async () => {
        expect(options.uri).to.equal('https://test.example.com/path/to/somewhere');
      });

      test('the options object has the query string object', async () => {
        expect(options.qs).to.equal({
          one: 1,
          two: 2
        });
      });
    });
  });

  experiment('.post', () => {
    let options;
    const payload = { foo: 'bar' };

    beforeEach(async () => {
      await request.post('path/to/somewhere', payload);
      options = request.cmRequest.post.lastCall.args[0];
    });

    test('the options object has json set to true', async () => {
      expect(options.json).to.be.true();
    });

    test('the options object has the correct URL', async () => {
      expect(options.uri).to.equal('https://test.example.com/path/to/somewhere');
    });

    test('the payload is included', async () => {
      expect(options.body).equal(payload);
    });
  });

  experiment('.patch', () => {
    let options;
    const payload = { foo: 'bar' };

    beforeEach(async () => {
      await request.patch('path/to/somewhere', payload);
      options = request.cmRequest.patch.lastCall.args[0];
    });

    test('the options object has json set to true', async () => {
      expect(options.json).to.be.true();
    });

    test('the options object has the correct URL', async () => {
      expect(options.uri).to.equal('https://test.example.com/path/to/somewhere');
    });

    test('the payload is included', async () => {
      expect(options.body).equal(payload);
    });
  });
});
