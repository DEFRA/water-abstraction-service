'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();

const companiesHouseApiConnector = require('../../../../src/lib/connectors/companies-house');
const companiesHouseService = require('../../../../src/modules/companies-house/services/companies-house-service');

const Pagination = require('../../../../src/lib/models/pagination');
const Company = require('../../../../src/lib/models/company');
const Address = require('../../../../src/lib/models/address');

const createCompaniesHouseResponse = () => ({
  page_number: 2,
  start_index: 40,
  items: [
    {
      description_identifier: [
        'incorporated-on'
      ],
      kind: 'searchresults#company',
      description: '012345 - Incorporated on 1  May 2007',
      snippet: '',
      company_status: 'active',
      title: 'BIG CO LIMITED',
      matches: {
        title: [
          1,
          9
        ],
        snippet: []
      },
      date_of_creation: '2007-05-01',
      address: {
        address_line_1: 'Big Farm Road',
        premises: '14',
        locality: 'Testington',
        postal_code: 'TT1 1TT'
      },
      company_type: 'ltd',
      links: {
        self: '/company/012345'
      },
      company_number: '012345',
      address_snippet: '14 Big Farm Road, Testington, TT1 1TT'
    }
  ],
  total_results: 80,
  items_per_page: 20,
  kind: 'search#companies'
});

experiment('modules/companies-house/services/companies-house-service', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.searchCompanies', () => {
    let result;

    experiment('when the company type is supported and there is no "care of"', () => {
      beforeEach(async () => {
        sandbox.stub(companiesHouseApiConnector, 'searchCompanies').resolves(createCompaniesHouseResponse());
        result = await companiesHouseService.searchCompanies('Test search', 3);
      });

      test('calls companies house API', async () => {
        expect(companiesHouseApiConnector.searchCompanies.calledWith(
          'Test search', 40, 20
        )).to.be.true();
      });

      test('result includes a pagination service model', async () => {
        const { pagination } = result;
        expect(pagination instanceof Pagination).to.be.true();
        expect(pagination.page).to.equal(2);
        expect(pagination.perPage).to.equal(20);
        expect(pagination.pageCount).to.equal(4);
        expect(pagination.totalRows).to.equal(80);
      });

      test('result includes an array of items', async () => {
        expect(result.data).to.be.array().length(1);
      });

      test('maps the company correctly', async () => {
        const { company } = result.data[0];
        expect(company instanceof Company).to.be.true();
        expect(company.name).to.equal('BIG CO LIMITED');
        expect(company.type).to.equal(Company.TYPE_ORGANISATION);
        expect(company.organisationType).to.equal(Company.ORGANISATION_TYPES.limitedCompany);
        expect(company.companyNumber).to.equal('012345');
      });

      test('maps the address correctly', async () => {
        const { address } = result.data[0];
        expect(address instanceof Address).to.be.true();
        expect(address.addressLine2).to.equal('14');
        expect(address.addressLine3).to.equal('Big Farm Road');
        expect(address.town).to.equal('Testington');
        expect(address.postcode).to.equal('TT1 1TT');
      });
    });

    experiment('when the company type is not supported', () => {
      beforeEach(async () => {
        const apiResponse = createCompaniesHouseResponse();
        apiResponse.items[0].company_type = 'old-public-company';
        sandbox.stub(companiesHouseApiConnector, 'searchCompanies').resolves(apiResponse);
        result = await companiesHouseService.searchCompanies('Test search', 3);
      });

      test('the company organisation type is not set', async () => {
        const { company } = result.data[0];
        expect(company.organisationType).to.be.undefined();
      });
    });
  });
});
