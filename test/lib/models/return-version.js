'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const ReturnVersion = require('../../../src/lib/models/return-version');
const ReturnLine = require('../../../src/lib/models/return-line');

class TestModel { };

experiment('lib/models/return-version', () => {
  let version;

  beforeEach(async () => {
    version = new ReturnVersion();
  });

  experiment('.id', () => {
    test('can be set to a GUID', async () => {
      const id = uuid();
      version.id = id;
      expect(version.id).to.equal(id);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        version.id = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-return ID string', async () => {
      const func = () => {
        version.id = 'not-a-guid';
      };
      expect(func).to.throw();
    });
  });

  experiment('.returnLines', () => {
    test('can be set to an array of purpose uses', async () => {
      const returnLines = [new ReturnLine()];
      version.returnLines = returnLines;
      expect(version.returnLines).to.equal(returnLines);
    });

    test('throws an error if not an array', async () => {
      const func = () => {
        const notAnArray = new ReturnLine();
        version.returnLines = notAnArray;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notReturnLines = [new TestModel()];
        version.returnLines = notReturnLines;
      };
      expect(func).to.throw();
    });
  });

  experiment('.isNilReturn', () => {
    test('can be set to a boolean true', async () => {
      version.isNilReturn = true;
      expect(version.isNilReturn).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      version.isNilReturn = false;
      expect(version.isNilReturn).to.equal(false);
    });

    test('throws an error if set to a different type', async () => {
      const func = () => {
        version.isNilReturn = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.isCurrentVersion', () => {
    test('can be set to a boolean true', async () => {
      version.isCurrentVersion = true;
      expect(version.isCurrentVersion).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      version.isCurrentVersion = false;
      expect(version.isCurrentVersion).to.equal(false);
    });

    test('throws an error if set to a different type', async () => {
      const func = () => {
        version.isCurrentVersion = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });
});
