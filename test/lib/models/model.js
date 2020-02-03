'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Model = require('../../../src/lib/models/model');
const uuid = require('uuid/v4');

class Bike extends Model {
  get numberOfGears () { return this._numberOfGears; }
  set numberOfGears (numberOfGears) { this._numberOfGears = numberOfGears; }
}

experiment('lib/models/model', () => {
  experiment('properties', () => {
    experiment('id', () => {
      test('validates that the id should be a uuid', async () => {
        const model = new Model();
        const func = () => (model.id = 'nope');
        expect(func).to.throw();
      });

      test('can be set if id value is valid', async () => {
        const id = uuid();
        const model = new Model();
        model.id = id;
        expect(model.id).to.equal(id);
      });
    });
  });

  experiment('.fromHash', () => {
    test('sets the properties correctly', async () => {
      const id = uuid();
      const bike = new Bike();
      bike.fromHash({
        id,
        numberOfGears: 1
      });

      expect(bike.numberOfGears).to.equal(1);
      expect(bike.id).to.equal(id);
    });

    test('returns the instance', async () => {
      const id = uuid();
      const bike = new Bike().fromHash({ id });
      expect(bike.id).to.equal(id);
    });
  });

  experiment('.pickFrom', () => {
    const bike = new Bike();
    const other = {
      id: uuid(),
      numberOfGears: 10,
      hasSuspension: false
    };

    bike.pickFrom(other, ['id', 'numberOfGears']);

    expect(bike.id).to.equal(other.id);
    expect(bike.numberOfGears).to.equal(other.numberOfGears);
    expect(bike.hasSuspension).to.be.undefined();
  });

  experiment('.toJSON', () => {
    test('returns the underscore prefixed values without the underscore', async () => {
      const id = uuid();
      const numberOfGears = 22;

      const bike = new Bike();
      bike.id = id;
      bike.numberOfGears = numberOfGears;

      const json = bike.toJSON();

      expect(json).to.equal({
        id,
        numberOfGears: 22
      });
    });
  });
});
