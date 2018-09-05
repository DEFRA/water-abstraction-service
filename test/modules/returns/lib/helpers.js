const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const { convertToCubicMetres } = require('../../../../src/modules/returns/lib/helpers.js');
const { InvalidUnitError } = require('../../../../src/modules/returns/lib/errors.js');

lab.experiment('Test returns helpers', () => {
  lab.test('The helper should convert known units', async () => {
    Code.expect(convertToCubicMetres(100, 'm³')).to.equal(100);
    Code.expect(convertToCubicMetres(100, 'l')).to.equal(0.1);
    Code.expect(convertToCubicMetres(100, 'Ml')).to.equal(100000);
    Code.expect(convertToCubicMetres(100, 'gal')).to.equal(0.454609);
  });

  lab.test('The helper should throw an error for unknown units', async () => {
    const func = () => {
      convertToCubicMetres(100, 'x');
    };
    Code.expect(func).to.throw(InvalidUnitError, 'Unknown unit x');
  });
});

exports.lab = lab;
