'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const SupportedSource = require('../../../src/lib/models/supported-source');

const supportedSourceMapper = require('../../../src/lib/mappers/supported-source');

experiment('lib/mappers/supported-source', () => {
  let result;

  const supportedSourceFromCsv = {
    reference: '1.0.0.0',
    name: 'Some SupportedSource'
  };

  experiment('.csvToModel', () => {
    beforeEach(async () => {
      result = supportedSourceMapper.csvToModel(supportedSourceFromCsv);
    });

    test('returns an instance of SupportedSource', async () => {
      expect(result instanceof SupportedSource).to.be.true();
    });

    test('sets the .reference property', async () => {
      expect(result.reference).to.equal(supportedSourceFromCsv.reference);
    });

    test('sets the .name property', async () => {
      expect(result.name).to.equal(supportedSourceFromCsv.name);
    });

    experiment('when the name is longer than 255 chars', () => {
      beforeEach(async () => {
        supportedSourceFromCsv.name = 'Parmesan taleggio cheese on toast. Cheese on toast paneer halloumi cheesy grin cheeseburger cow cut the cheese edam. Lancashire halloumi taleggio cheese triangles edam gouda croque monsieur edam. Bavarian bergkase swiss say cheese cheesecake cream cheese red leicester stilton goat. Say cheese who moved my cheese emmental stilton who moved my cheese cottage cheese bocconcini edam. Lancashire brie croque monsieur macaroni cheese cottage cheese cauliflower cheese babybel dolcelatte. Stilton cheese on toast smelly cheese jarlsberg cheeseburger brie cheddar cottage cheese. Parmesan cut the cheese queso taleggio cheese triangles croque monsieur bocconcini monterey jack. Cheesecake squirty cheese everyone loves pepper jack cheese triangles stilton.';
        result = supportedSourceMapper.csvToModel(supportedSourceFromCsv);
      });

      test('the name is truncated to 255 chars', async () => {
        expect(result.name).to.equal('Parmesan taleggio cheese on toast. Cheese on toast paneer halloumi cheesy grin cheeseburger cow cut the cheese edam. Lancashire halloumi taleggio cheese triangles edam gouda croque monsieur edam. Bavarian bergkase swiss say cheese cheesecake cream chee...');
      });
    });
  });
});
