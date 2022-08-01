const Lab = require('@hapi/lab')
const lab = Lab.script()
const Code = require('@hapi/code')

const { convertToCubicMetres, convertToUserUnit, InvalidUnitError } = require('../../../../src/modules/returns/lib/unit-conversion.js')

lab.experiment('Test returns helpers', () => {
  lab.test('convertToCubicMetres should convert known units', async () => {
    Code.expect(convertToCubicMetres(100, 'm³')).to.equal(100)
    Code.expect(convertToCubicMetres(100, 'l')).to.equal(0.1)
    Code.expect(convertToCubicMetres(100, 'Ml')).to.equal(100000)
    Code.expect(convertToCubicMetres(100, 'gal')).to.equal(0.454609)
  })

  lab.test('convertToCubicMetres should throw an error for unknown units', async () => {
    const func = () => {
      convertToCubicMetres(100, 'x')
    }
    Code.expect(func).to.throw(InvalidUnitError, 'Unknown unit x')
  })

  lab.test('convertToCubicMetres should return null when null given', async () => {
    Code.expect(convertToCubicMetres(null, 'm³')).to.equal(null)
    Code.expect(convertToCubicMetres(null, 'l')).to.equal(null)
    Code.expect(convertToCubicMetres(null, 'Ml')).to.equal(null)
    Code.expect(convertToCubicMetres(null, 'gal')).to.equal(null)
  })

  lab.test('convertToUserUnit should convert known units', async () => {
    Code.expect(convertToUserUnit(100, 'm³')).to.equal(100)
    Code.expect(convertToUserUnit(100, 'l')).to.equal(100000)
    Code.expect(convertToUserUnit(100, 'Ml')).to.equal(0.1)
    Code.expect(convertToUserUnit(100, 'gal')).to.equal(21996.924829900)
  })

  lab.test('convertToUserUnit should throw an error for unknown units', async () => {
    const func = () => {
      convertToUserUnit(100, 'x')
    }
    Code.expect(func).to.throw(InvalidUnitError, 'Unknown unit x')
  })

  lab.test('convertToUserUnit should return null when null given', async () => {
    Code.expect(convertToUserUnit(null, 'm³')).to.equal(null)
    Code.expect(convertToUserUnit(null, 'l')).to.equal(null)
    Code.expect(convertToUserUnit(null, 'Ml')).to.equal(null)
    Code.expect(convertToUserUnit(null, 'gal')).to.equal(null)
  })
})

exports.lab = lab
