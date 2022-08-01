'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const Licence = require('../../../src/lib/models/licence')
const Region = require('../../../src/lib/models/region')
const LicenceAgreement = require('../../../src/lib/models/licence-agreement')

const data = {
  id: 'add1cf3b-7296-4817-b013-fea75a928580',
  licenceNumber: '01/12/*G/R01',
  region: new Region('d61551ec-7182-42dc-bb90-c1dbecaf1350', Region.types.region),
  startDate: '2019-01-01',
  expiredDate: '2020-04-02',
  lapsedDate: '2019-12-23',
  revokedDate: '2019-06-03',
  licenceAgreements: [new LicenceAgreement()]
}

class TestModel {};

experiment('lib/models/licence', () => {
  let licence

  beforeEach(async () => {
    licence = new Licence()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      licence.id = data.id
      expect(licence.id).to.equal(data.id)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        licence.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.licenceNumber', () => {
    test('can be set to a valid licence number', async () => {
      licence.licenceNumber = data.licenceNumber
      expect(licence.licenceNumber).to.equal(data.licenceNumber)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        licence.licenceNumber = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to an invalid licence number', async () => {
      const func = () => {
        licence.licenceNumber = '01/123/£$'
      }
      expect(func).to.throw()
    })
  })

  experiment('.toJSON', () => {
    test('returns the expected object', async () => {
      licence.id = data.id
      licence.licenceNumber = data.licenceNumber

      const json = licence.toJSON()

      expect(json.id).to.equal(data.id)
      expect(json.licenceNumber).to.equal(data.licenceNumber)
      expect(json.endDate).to.be.null()
    })
  })

  // Region fields
  experiment('.region', () => {
    test('can be set to a region instance', async () => {
      licence.region = data.region
      expect(licence.region).to.equal(data.region)
    })

    test('throws an error if set to a value which is not an instance of Region', async () => {
      const func = () => {
        licence.region = {}
      }
      expect(func).to.throw()
    })
  })

  experiment('.historicalArea', () => {
    test('can be set to a region instance', async () => {
      licence.historicalArea = data.region
      expect(licence.historicalArea).to.equal(data.region)
    })

    test('throws an error if set to a value which is not an instance of Region', async () => {
      const func = () => {
        licence.historicalArea = {}
      }
      expect(func).to.throw()
    })
  })

  experiment('.regionalChargeArea', () => {
    test('can be set to a region instance', async () => {
      licence.regionalChargeArea = data.region
      expect(licence.regionalChargeArea).to.equal(data.region)
    })

    test('throws an error if set to a value which is not an instance of Region', async () => {
      const func = () => {
        licence.regionalChargeArea = {}
      }
      expect(func).to.throw()
    })
  })

  experiment('.startDate', () => {
    test('can be set to a date string', async () => {
      licence.startDate = data.startDate
      expect(licence.startDate).to.equal(data.startDate)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        licence.startDate = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        licence.startDate = 'not-a-date'
      }
      expect(func).to.throw()
    })
  })

  experiment('.expiredDate', () => {
    test('can be set to a date string', async () => {
      licence.expiredDate = data.expiredDate
      expect(licence.expiredDate).to.equal(data.expiredDate)
    })

    test('can be set to null', async () => {
      licence.expiredDate = null
      expect(licence.expiredDate).to.equal(null)
    })

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        licence.expiredDate = 'not-a-date'
      }
      expect(func).to.throw()
    })
  })

  experiment('.lapsedDate', () => {
    test('can be set to a date string', async () => {
      licence.lapsedDate = data.lapsedDate
      expect(licence.lapsedDate).to.equal(data.lapsedDate)
    })

    test('can be set to null', async () => {
      licence.lapsedDate = null
      expect(licence.lapsedDate).to.equal(null)
    })

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        licence.lapsedDate = 'not-a-date'
      }
      expect(func).to.throw()
    })
  })

  experiment('.revokedDate', () => {
    test('can be set to a date string', async () => {
      licence.revokedDate = data.revokedDate
      expect(licence.revokedDate).to.equal(data.revokedDate)
    })

    test('can be set to null', async () => {
      licence.revokedDate = null
      expect(licence.revokedDate).to.equal(null)
    })

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        licence.revokedDate = 'not-a-date'
      }
      expect(func).to.throw()
    })
  })

  experiment('.endDate', () => {
    test('returns null when expired, lapsed and revoked dates are null', async () => {
      licence.expiredDate = null
      licence.lapsedDate = null
      licence.revokedDate = null
      expect(licence.endDate).to.equal(null)
    })

    test('returns earliest date if some are set', async () => {
      licence.expiredDate = null
      licence.lapsedDate = data.lapsedDate
      licence.revokedDate = null
      expect(licence.endDate).to.equal(data.lapsedDate)
    })

    test('returns earliest date if all are set', async () => {
      licence.expiredDate = data.expiredDate
      licence.lapsedDate = data.lapsedDate
      licence.revokedDate = data.revokedDate
      expect(licence.endDate).to.equal(data.revokedDate)
    })
  })

  experiment('.licenceAgreements', () => {
    test('can be set to an array of licence agreements', async () => {
      licence.licenceAgreements = data.licenceAgreements
      expect(licence.licenceAgreements).to.equal(data.licenceAgreements)
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notLicenceAgreements = [new TestModel()]
        licence.licenceAgreements = notLicenceAgreements
      }
      expect(func).to.throw()
    })
  })

  experiment('.endDateReason', () => {
    test('returns the reason for the end date', async () => {
      licence.expiredDate = data.expiredDate
      licence.lapsedDate = data.lapsedDate
      licence.revokedDate = data.revokedDate
      expect(licence.endDateReason).to.equal('revokedDate')
    })

    test('returns the null if no end dates are set', async () => {
      expect(licence.endDateReason).to.equal(null)
    })
  })

  experiment('.isActive', () => {
    const futureDate = '3000-01-01'

    test('returns false if future dated', async () => {
      licence.startDate = futureDate
      expect(licence.isActive).to.equal(false)
    })

    test('returns false if expiry date in past', async () => {
      licence.expiredDate = data.expiredDate
      expect(licence.isActive).to.equal(false)
    })

    test('returns true if expiry date in future', async () => {
      licence.expiredDate = futureDate
      expect(licence.isActive).to.equal(true)
    })

    test('returns false if lapsed date in past', async () => {
      licence.lapsedDate = data.lapsedDate
      expect(licence.isActive).to.equal(false)
    })

    test('returns true if expiry date in future', async () => {
      licence.lapsedDate = futureDate
      expect(licence.isActive).to.equal(true)
    })

    test('returns false if revoked date in past', async () => {
      licence.revokedDate = data.revokedDate
      expect(licence.isActive).to.equal(false)
    })

    test('returns true if expiry date in future', async () => {
      licence.revokedDate = futureDate
      expect(licence.isActive).to.equal(true)
    })
  })
})
