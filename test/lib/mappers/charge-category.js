'use strict';

const uuid = require('uuid/v4');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeCategory = require('../../../src/lib/models/charge-category');

const chargeCategoryMapper = require('../../../src/lib/mappers/charge-category');

experiment('lib/mappers/charge-category', () => {
  let result;

  const chargeCategoryFromCsv = {
    reference: '1.0.0.0',
    description: 'Some category',
    short_description: 'Some category'
  };

  experiment('.csvToModel', () => {
    beforeEach(async () => {
      result = chargeCategoryMapper.csvToModel(chargeCategoryFromCsv);
    });

    test('returns an instance of ChargeCategory', async () => {
      expect(result instanceof ChargeCategory).to.be.true();
    });

    test('sets the .reference property', async () => {
      expect(result.reference).to.equal(chargeCategoryFromCsv.reference);
    });

    test('sets the .description property', async () => {
      expect(result.description).to.equal(chargeCategoryFromCsv.description);
    });

    test('sets the .short_description property', async () => {
      expect(result.shortDescription).to.equal(chargeCategoryFromCsv.short_description);
    });

    experiment('when the short_description is longer than 150 chars', () => {
      beforeEach(async () => {
        chargeCategoryFromCsv.short_description = 'Parmesan taleggio cheese on toast. Cheese on toast paneer halloumi cheesy grin cheeseburger cow cut the cheese edam. Lancashire halloumi taleggio cheese triangles edam gouda croque monsieur edam. Bavarian bergkase swiss say cheese cheesecake cream cheese red leicester stilton goat. Say cheese who moved my cheese emmental stilton who moved my cheese cottage cheese bocconcini edam. Lancashire brie croque monsieur macaroni cheese cottage cheese cauliflower cheese babybel dolcelatte. Stilton cheese on toast smelly cheese jarlsberg cheeseburger brie cheddar cottage cheese. Parmesan cut the cheese queso taleggio cheese triangles croque monsieur bocconcini monterey jack. Cheesecake squirty cheese everyone loves pepper jack cheese triangles stilton.';
        result = chargeCategoryMapper.csvToModel(chargeCategoryFromCsv);
      });

      test('the short description is truncated to 150 chars', async () => {
        expect(result.shortDescription).to.equal('Parmesan taleggio cheese on toast. Cheese on toast paneer halloumi cheesy grin cheeseburger cow cut the cheese edam. Lancashire halloumi taleggio c...');
      });
    });
  });
});
