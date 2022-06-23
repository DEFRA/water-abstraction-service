const sinon = require('sinon')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const uploadPreviewMapper = require('../../../../src/modules/returns/lib/upload-preview-mapper.js')

sinon.createSandbox()

const serviceReturn = {
  metadata: {
    foo: 'bar'
  }
}

const uploadedReturns = {
  nil: {
    isNil: true
  },
  withLines: {
    isNil: false,
    lines: [{
      quantity: 2
    }, {
      quantity: 3
    }]
  }
}

experiment('Upload preview mapper', () => {
  experiment('getTotalVolume', () => {
    test('should return null if nil return', async () => {
      const result = uploadPreviewMapper.getTotalVolume(uploadedReturns.nil)
      expect(result).to.equal(null)
    })

    test('should return total volume if not a nil return', async () => {
      const result = uploadPreviewMapper.getTotalVolume(uploadedReturns.withLines)
      expect(result).to.equal(5)
    })
  })

  experiment('mapSingleReturn', () => {
    test('it should include the total volume', async () => {
      const result = uploadPreviewMapper.mapSingleReturn(uploadedReturns.withLines)
      expect(result.totalVolume).to.be.a.number()
    })

    test('it should include lines data', async () => {
      const result = uploadPreviewMapper.mapSingleReturn(uploadedReturns.withLines)
      expect(result.lines).to.be.an.array()
    })

    test('it should include the metadata from the return service data', async () => {
      const result = uploadPreviewMapper.mapSingleReturn(uploadedReturns.withLines, serviceReturn)
      expect(result.metadata).to.equal(serviceReturn.metadata)
    })
  })

  experiment('mapMultipleReturn', () => {
    test('it should include the total volume', async () => {
      const result = uploadPreviewMapper.mapMultipleReturn(uploadedReturns.withLines)
      expect(result.totalVolume).to.be.a.number()
    })

    test('it should exclude lines data', async () => {
      const result = uploadPreviewMapper.mapMultipleReturn(uploadedReturns.withLines)
      expect(result.lines).to.be.a.undefined()
    })
  })
})
