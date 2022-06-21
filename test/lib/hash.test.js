'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const hash = require('../../src/lib/hash');

experiment('lib/hash', () => {
  experiment('.createMd5Hash', () => {
    test('creates a known Hex hash', async () => {
      const input = 'Today is Friday';
      const expected = '363821f1693184f62bc35810b51efe81';

      const output = hash.createMd5Hash(input);
      expect(output).to.equal(expected);
    });

    test('for a list of different inputs the output is 32 chars', async () => {
      const inputs = [
        'hello',
        'goodbye',
        'if a tree falls in a forest',
        '51 House The Road, The Town, The County, The Country, The POST CODE!!!',
        '1',
        '1233333',
        '123/123',
        'a:123:0:blah:--1'
      ];

      const output = inputs.map(hash.createMd5Hash).filter(x => x.length !== 32);

      expect(output).to.have.length(0);
    });
  });
});
