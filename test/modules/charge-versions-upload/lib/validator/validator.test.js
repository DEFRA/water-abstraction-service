'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const repos = require('../../../../../src/lib/connectors/repos')
const { billing } = require('../../../../../config')
const { validate } = require('../../../../../src/modules/charge-versions-upload/lib/validator')
const { snakeCase } = require('lodash')
const helpers = require('../../../../../src/modules/charge-versions-upload/lib/helpers')

const SUPPORTED_SOURCE_NAME = 'Valid Supported Source Name'
const PURPOSE_USE_DESCRIPTION = 'Valid Purpose Use Description'
const PURPOSE_USE_DESCRIPTION_TPT = 'Valid Purpose Use Description With Two Part Tariff'
const LINE_DESCRIPTION = 'Valid Line Description'
const INVOICE_ACCOUNT = 'Valid Invoice Account'

const testRow = {
  licenceNumber: 'TEST/LICENCE/1',
  chargeInformationStartDate: '01/04/2022',
  chargeInformationBillingAccount: 'TEST/BILLING/ACCOUNT',
  chargeElementPurpose: PURPOSE_USE_DESCRIPTION_TPT,
  chargeElementDescription: 'Test Description',
  chargeElementAbstractionPeriod: '01/04-31/03',
  chargeElementAuthorisedQuantity: '2920.123456',
  chargeElementTimeLimitStart: '',
  chargeElementTimeLimitEnd: '',
  chargeElementLoss: 'medium',
  chargeElementAgreementApply: 'Y',
  chargeReferenceDetailsChargeElementGroup: 'A',
  chargeReferenceDetailsSource: 'N',
  chargeReferenceDetailsLoss: 'medium',
  chargeReferenceDetailsVolume: '2920',
  chargeReferenceDetailsWaterAvailability: 'Y',
  chargeReferenceDetailsModelling: 'tier 1',
  chargeReferenceLineDescription: LINE_DESCRIPTION,
  chargeReferenceDetailsSupportedSourceCharge: 'N',
  chargeReferenceDetailsSupportedSourceName: '',
  chargeReferenceDetailsPublicWaterSupply: 'Y',
  chargeReferenceDetailsAggregateFactor: '1',
  chargeReferenceDetailsAdjustmentFactor: '1',
  chargeReferenceDetailsAbatementFactor: '0.1',
  chargeReferenceDetailsWinterDiscount: 'N',
  chargeReferenceDetailsTwoPartTariffAgreementApplies: 'N',
  chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: 'N',
  chargeInformationNotes: ''
}

const getHeadings = data => Object.keys(data).map(heading => snakeCase(heading))
const getValues = data => Object.values(data)

const testValidate = async (firstRow, ...otherRows) => validate([getHeadings(firstRow), getValues(firstRow), ...otherRows.map(getValues)].join('\n'))

const rowErrors = validationErrors => ({
  validationErrors,
  errorType: 'rows',
  isValid: false
})

experiment('validator', () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getLicence')
    sandbox.stub(helpers, 'getLicenceVersionPurposes')
    sandbox.stub(helpers, 'getInvoiceAccount')
    sandbox.stub(helpers, 'getPurposeUses')
    sandbox.stub(helpers, 'getSupportedSources')
    sandbox.stub(helpers, 'updateEventStatus')
    sandbox.stub(repos.supportedSources, 'findAll')
    sandbox.stub(repos.purposeUses, 'findAll')
    sandbox.stub(billing, 'srocStartDate')
    helpers.clearCache()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.validate', () => {
    const dummyLicence = {
      startDate: '2022-03-31',
      expiredDate: '2022-05-01',
      lapsedDate: '2022-05-01',
      revokedDate: '2022-05-01',
      isWaterUndertaker: true
    }

    beforeEach(() => {
      billing.srocStartDate = new Date('2022-04-01')
      helpers.getSupportedSources.resolves([
        { name: SUPPORTED_SOURCE_NAME }
      ])
      helpers.getPurposeUses.resolves([
        { description: PURPOSE_USE_DESCRIPTION, isTwoPartTariff: false },
        { description: PURPOSE_USE_DESCRIPTION_TPT, isTwoPartTariff: true }
      ])

      helpers.getLicence = async licenceNumber => licenceNumber === 'INVALID'
        ? undefined
        : dummyLicence
      helpers.getLicenceVersionPurposes.resolves([
        { purposeUse: { description: PURPOSE_USE_DESCRIPTION } },
        { purposeUse: { description: PURPOSE_USE_DESCRIPTION_TPT } }
      ])
      helpers.getInvoiceAccount.resolves([INVOICE_ACCOUNT])
      helpers.updateEventStatus.resolves()
    })

    test('when the number of headings is inconsistent with the number of rows', async () => {
      const result = await validate(['heading-1,heading-2', 'col-1'].join('\n'))
      expect(result).to.equal({
        validationErrors: ['Number of columns is inconsistent on line 2'],
        errorType: 'parse',
        isValid: false
      })
    })

    experiment('with a single row', () => {
      test('when the contents of a csv are valid ', async () => {
        expect(await testValidate(testRow)).to.equal({
          isValid: true
        })
      })

      experiment('when the licence number', () => {
        test('is blank', async () => {
          const row = { ...testRow, licenceNumber: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, licence_number is blank']))
        })

        test('is invalid', async () => {
          const row = { ...testRow, licenceNumber: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, licence_number is not valid']))
        })
      })

      experiment('when the charge information start date', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeInformationStartDate: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_information_start_date is blank']))
        })

        test('has an incorrect date format', async () => {
          const row = { ...testRow, chargeInformationStartDate: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_information_start_date has an incorrect format, expected DD/MM/YYYY"']))
        })

        test('is before the licence start date', async () => {
          const row = { ...testRow, chargeInformationStartDate: '30/03/2022' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_information_start_date is before the licence start date']))
        })

        test('is before 1 April 2022', async () => {
          const row = { ...testRow, chargeInformationStartDate: '31/03/2022' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_information_start_date is before 1 April 2022']))
        })
      })

      experiment('when the charge element purpose', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeElementPurpose: '', chargeElementAgreementApply: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_purpose is blank']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeElementPurpose: 'INVALID', chargeElementAgreementApply: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_purpose is not an accepted term']))
        })
      })

      test('when the charge element description is blank', async () => {
        const row = { ...testRow, chargeElementDescription: '' }
        expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_description is blank']))
      })

      test('when the charge element abstraction period has an incorrect date format', async () => {
        const row = { ...testRow, chargeElementAbstractionPeriod: 'INVALID' }
        expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_element_abstraction_period is an incorrect format, expected DD/MM-DD/MM"']))
      })

      experiment('when the charge element authorised quantity', () => {
        test('is not a number', async () => {
          const row = { ...testRow, chargeElementAuthorisedQuantity: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_authorised_quantity is not a number']))
        })

        test('has more than 6 decimal places', async () => {
          const row = { ...testRow, chargeElementAuthorisedQuantity: '10.1234567' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_authorised_quantity has more than 6 decimal places']))
        })
      })

      experiment('when the charge element time limit start', () => {
        const row = { ...testRow, chargeElementTimeLimitEnd: '01/04/2022' }

        test('has an incorrect date format', async () => {
          row.chargeElementTimeLimitStart = 'INVALID'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_element_time_limit_start has an incorrect format, expected DD/MM/YYYY"']))
        })

        test('is before the charge information start date', async () => {
          row.chargeElementTimeLimitStart = '01/01/2022'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_time_limit_start is before the charge information start date']))
        })
      })

      experiment('when the charge element time limit end', () => {
        const row = { ...testRow, chargeElementTimeLimitStart: '01/04/2022' }

        test('has an incorrect date format', async () => {
          row.chargeElementTimeLimitEnd = 'INVALID'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, "charge_element_time_limit_end has an incorrect format, expected DD/MM/YYYY"']))
        })

        test('is before the time limit start', async () => {
          row.chargeElementTimeLimitEnd = '01/01/2022'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_time_limit_end is before the time limit start']))
        })

        test('is after the licence expiry date', async () => {
          row.chargeElementTimeLimitEnd = '01/06/2022'
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_time_limit_end is after the licence expiry date']))
        })
      })

      test('when the charge element loss is not an accepted term', async () => {
        const row = { ...testRow, chargeElementLoss: 'INVALID' }
        expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_loss is not an accepted term']))
      })

      experiment('when the charge element agreement apply', () => {
        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeElementAgreementApply: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_agreement_apply is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeElementPurpose: PURPOSE_USE_DESCRIPTION, chargeElementAgreementApply: 'Y' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_element_agreement_apply does not match the purpose']))
        })
      })

      experiment('when the charge reference details charge element group', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsChargeElementGroup: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_charge_element_group is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeReferenceDetailsChargeElementGroup: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_charge_element_group is not an accepted term']))
        })
      })

      experiment('when the charge reference details source', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsSource: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_source is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeReferenceDetailsSource: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_source is not an accepted term']))
        })
      })

      experiment('when the charge reference details loss', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsLoss: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_loss is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeReferenceDetailsLoss: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_loss is not an accepted term']))
        })
      })

      experiment('when the charge reference details volume', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsVolume: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is blank']))
        })

        test('is not a number', async () => {
          const row = { ...testRow, chargeReferenceDetailsVolume: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is not a number']))
        })

        test('is zero', async () => {
          const row = { ...testRow, chargeReferenceDetailsVolume: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is less than or equal to 0']))
        })

        test('is a negative number', async () => {
          const row = { ...testRow, chargeReferenceDetailsVolume: '-1' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is less than or equal to 0']))
        })

        test('has more than 6 decimal places', async () => {
          const row = { ...testRow, chargeReferenceDetailsVolume: '123.1234567' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume has more than 6 decimal places']))
        })

        test('is greater than 1000000000000000', async () => {
          const row = { ...testRow, chargeReferenceDetailsVolume: '1000000000000001' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume is too large']))
        })

        test('has too many digits', async () => {
          const row = { ...testRow, chargeReferenceDetailsVolume: '12345678.0123456789' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_volume has too many digits']))
        })
      })

      experiment('when the charge reference details water availability', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsWaterAvailability: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_water_availability is blank']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeReferenceDetailsWaterAvailability: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_water_availability is not an accepted term']))
        })
      })

      experiment('when the charge reference details modelling', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsModelling: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_modelling is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeReferenceDetailsModelling: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_modelling is not an accepted term']))
        })
      })

      experiment('when the charge reference line description', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceLineDescription: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_line_description is blank']))
        })

        test('contains more than 180 characters', async () => {
          const row = { ...testRow, chargeReferenceLineDescription: 'a'.repeat(181) }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_line_description has more than 180 characters']))
        })

        test('contains unaccepted characters', async () => {
          const row = { ...testRow, chargeReferenceLineDescription: 'I_N_V_A_L_I_D?' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_line_description contains at least one unaccepted character']))
        })
      })

      experiment('when the charge reference details supported source charge', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsSupportedSourceCharge: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_charge is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeReferenceDetailsSupportedSourceCharge: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_charge is not an accepted term']))
        })
      })

      experiment('when the charge reference details supported source name', () => {
        test('is not an accepted term', async () => {
          const row = {
            ...testRow,
            chargeReferenceDetailsSupportedSourceName: 'INVALID'
          }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is not an accepted term']))
        })

        test('is blank and the supported source charge is "Y"', async () => {
          const row = {
            ...testRow,
            chargeReferenceDetailsSupportedSourceName: '',
            chargeReferenceDetailsSupportedSourceCharge: 'Y'
          }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is blank when the supported source charge is "Y"']))
        })

        test('is populated and the supported source charge is "N"', async () => {
          const row = {
            ...testRow,
            chargeReferenceDetailsSupportedSourceName: SUPPORTED_SOURCE_NAME,
            chargeReferenceDetailsSupportedSourceCharge: 'N'
          }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_supported_source_name is populated when the supported source charge is "N"']))
        })
      })

      experiment('when the charge reference details public water supply', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsPublicWaterSupply: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply is not an accepted term']))
        })

        test('is not an accepted term', async () => {
          const row = { ...testRow, chargeReferenceDetailsPublicWaterSupply: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply is not an accepted term']))
        })

        test('is Y when the licence holder is not a water undertaker', async () => {
          helpers.getLicence = async licenceNumber => {
            return {
              ...dummyLicence,
              isWaterUndertaker: false
            }
          }
          const row = { ...testRow, chargeReferenceDetailsPublicWaterSupply: 'Y' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_public_water_supply cannot be Y if the licence holder is not a water undertaker']))
        })
      })

      experiment('when the charge reference details aggregate factor', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsAggregateFactor: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is blank']))
        })

        test('is not a number', async () => {
          const row = { ...testRow, chargeReferenceDetailsAggregateFactor: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is not a number']))
        })

        test('has more than 15 decimal places', async () => {
          const row = { ...testRow, chargeReferenceDetailsAggregateFactor: '1.1234567890123456' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor has more than 15 decimal places']))
        })

        test('is less than or equal to 0', async () => {
          const row = { ...testRow, chargeReferenceDetailsAggregateFactor: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_aggregate_factor is less than or equal to 0']))
        })
      })

      experiment('when the charge reference details adjustment factor', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsAdjustmentFactor: '' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is blank']))
        })

        test('is not a number', async () => {
          const row = { ...testRow, chargeReferenceDetailsAdjustmentFactor: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is not a number']))
        })

        test('has more than 15 decimal places', async () => {
          const row = { ...testRow, chargeReferenceDetailsAdjustmentFactor: '1.1234567890123456' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor has more than 15 decimal places']))
        })

        test('is less than or equal to 0', async () => {
          const row = { ...testRow, chargeReferenceDetailsAdjustmentFactor: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_adjustment_factor is less than or equal to 0']))
        })
      })

      experiment('when the charge reference details abatement factor', () => {
        test('is blank', async () => {
          const row = { ...testRow, chargeReferenceDetailsAbatementFactor: '' }
          expect(await testValidate(row)).to.equal({ isValid: true })
        })

        test('is not a number', async () => {
          const row = { ...testRow, chargeReferenceDetailsAbatementFactor: 'INVALID' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is not a number']))
        })

        test('has more than 15 decimal places', async () => {
          const row = { ...testRow, chargeReferenceDetailsAbatementFactor: '0.1234567890123456' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor has more than 15 decimal places']))
        })

        test('is less than or equal to 0', async () => {
          const row = { ...testRow, chargeReferenceDetailsAbatementFactor: '0' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is less than or equal to 0']))
        })

        test('is greater than or equal to 1', async () => {
          const row = { ...testRow, chargeReferenceDetailsAbatementFactor: '1' }
          expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_abatement_factor is greater than or equal to 1']))
        })

        experiment('when the charge reference details winter discount', () => {
          test('is blank', async () => {
            const row = { ...testRow, chargeReferenceDetailsWinterDiscount: '' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_winter_discount is not an accepted term']))
          })

          test('is not an accepted term', async () => {
            const row = { ...testRow, chargeReferenceDetailsWinterDiscount: 'INVALID' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_winter_discount is not an accepted term']))
          })
        })

        experiment('when the charge reference details two part tariff agreement applies', () => {
          test('is blank', async () => {
            const row = { ...testRow, chargeReferenceDetailsTwoPartTariffAgreementApplies: '' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_two_part_tariff_agreement_applies is not an accepted term']))
          })

          test('is not an accepted term', async () => {
            const row = { ...testRow, chargeReferenceDetailsTwoPartTariffAgreementApplies: 'INVALID' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_two_part_tariff_agreement_applies is not an accepted term']))
          })
        })

        experiment('when the charge reference details canal and river trust agreement applies', () => {
          test('is blank', async () => {
            const row = { ...testRow, chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: '' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_canal_and_river_trust_agreement_applies is not an accepted term']))
          })

          test('is not an accepted term', async () => {
            const row = { ...testRow, chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: 'INVALID' }
            expect(await testValidate(row)).to.equal(rowErrors(['Row 2, charge_reference_details_canal_and_river_trust_agreement_applies is not an accepted term']))
          })
        })
      })

      test('when the contents of a row has two invalid fields ', async () => {
        expect(await testValidate({
          ...testRow,
          chargeReferenceDetailsAbatementFactor: '1',
          licenceNumber: 'INVALID'
        })).to.equal({
          errorType: 'rows',
          validationErrors: [
            'Row 2, charge_reference_details_abatement_factor is greater than or equal to 1',
            'Row 2, licence_number is not valid'
          ],
          isValid: false
        })
      })
    })

    experiment('with multiple rows', () => {
      // Two rows with test licence 2
      const testRow2 = { ...testRow, licenceNumber: 'TEST/LICENCE/2', chargeReferenceDetailsChargeElementGroup: 'A', chargeReferenceDetailsLoss: 'high' }
      const testRow3 = { ...testRow, licenceNumber: 'TEST/LICENCE/2', chargeReferenceDetailsChargeElementGroup: 'A', chargeReferenceDetailsLoss: 'low' }

      // Two rows with test licence 3
      const testRow4 = { ...testRow, licenceNumber: 'TEST/LICENCE/3', chargeReferenceDetailsChargeElementGroup: 'B' }
      const testRow5 = { ...testRow, licenceNumber: 'TEST/LICENCE/3', chargeReferenceDetailsChargeElementGroup: 'B' }

      test('when the contents of a csv with 5 rows are valid ', async () => {
        expect(await testValidate(testRow, testRow2, testRow3, testRow4, testRow5)).to.equal({
          isValid: true
        })
      })

      test('when the contents of a csv with 5 rows has 2 invalid rows ', async () => {
        expect(await testValidate(
          testRow,
          testRow2,
          { ...testRow3, licenceNumber: 'INVALID' },
          testRow4,
          { ...testRow5, chargeReferenceDetailsAbatementFactor: '1' }
        )).to.equal({
          errorType: 'rows',
          validationErrors: [
            'Row 4, licence_number is not valid',
            'Row 6, charge_reference_details_abatement_factor is greater than or equal to 1'
          ],
          isValid: false
        })
      })

      experiment('when the contents of a csv with 5 rows has 2 rows for the same licence number and group where the group is A', () => {
        test('all reference details are the same', async () => {
          expect(await testValidate(
            testRow,
            { ...testRow2, chargeReferenceDetailsLoss: 'low' },
            { ...testRow3, chargeReferenceDetailsLoss: 'low' },
            testRow4,
            testRow5
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 3, has the same licence and references as row 4 and both are in group A'],
            isValid: false
          })
        })
      })

      experiment('when the contents of a csv with 5 rows has 2 rows for the same licence number and group where the group is not A', () => {
        test('different source', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, chargeReferenceDetailsSource: 'Y' },
            { ...testRow5, chargeReferenceDetailsSource: 'N' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_source is different'],
            isValid: false
          })
        })

        test('different loss', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, chargeReferenceDetailsLoss: 'low' },
            { ...testRow5, chargeReferenceDetailsLoss: 'high' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_loss is different'],
            isValid: false
          })
        })

        test('different volume', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, chargeReferenceDetailsVolume: '10' },
            { ...testRow5, chargeReferenceDetailsVolume: '25' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_volume is different'],
            isValid: false
          })
        })

        test('different water availability', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, chargeReferenceDetailsWaterAvailability: 'Y' },
            { ...testRow5, chargeReferenceDetailsWaterAvailability: 'N' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_water_availability is different'],
            isValid: false
          })
        })

        test('different modelling', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, chargeReferenceDetailsModelling: 'tier 1' },
            { ...testRow5, chargeReferenceDetailsModelling: 'tier 2' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence and group as row 6 but charge_reference_details_modelling is different'],
            isValid: false
          })
        })

        test('different billing account', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, chargeInformationBillingAccount: 'BILLING-ACCOUNT-ONE' },
            { ...testRow5, chargeInformationBillingAccount: 'BILLING-ACCOUNT-TWO' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence as row 6 but charge_information_billing_account is different'],
            isValid: false
          })
        })

        test('different start date', async () => {
          expect(await testValidate(
            testRow,
            testRow2,
            testRow3,
            { ...testRow4, chargeInformationStartDate: '01/04/2022' },
            { ...testRow5, chargeInformationStartDate: '02/05/2023' }
          )).to.equal({
            errorType: 'rows',
            validationErrors: ['Row 5, has the same licence as row 6 but charge_information_start_date is different'],
            isValid: false
          })
        })
      })
    })
  })
})
