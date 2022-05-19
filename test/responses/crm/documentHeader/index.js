const notFound = () => ({
  data: [],
  error: null,
  pagination: {
    page: 1,
    perPage: 100,
    totalRows: 0,
    pageCount: 0
  }
})

const singleResponse = () => ({
  data: [
    {
      company_entity_id: 'company-entity-id',
      document_id: 'document-id',
      document_name: 'A document name',
      metadata: {
        AddressLine1: 'Add 1',
        AddressLine2: 'Add 2',
        AddressLine3: 'Add 3',
        AddressLine4: 'Add 4',
        Country: '',
        County: 'County',
        Expires: null,
        Forename: '',
        Initials: '',
        IsCurrent: true,
        Modified: '19931021',
        Name: 'Licence Holder Name',
        Postcode: 'AB3 4BA',
        Salutation: '',
        Town: 'Town',
        contacts: [
          {
            addressLine1: 'Add 1',
            addressLine2: 'Add 1',
            addressLine3: 'Add 1',
            addressLine4: 'Add 1',
            country: null,
            county: 'county',
            forename: null,
            initials: null,
            name: 'Licence Holder Name',
            postcode: 'AB3 4BA',
            role: 'Licence holder',
            salutation: null,
            town: 'Town',
            type: 'Organisation'
          }
        ]
      },
      regime_entity_id: 'regime-id',
      system_external_id: 'lic-1',
      system_id: 'permit-repo',
      system_internal_id: '1234',
      verification_id: 'verification-id'
    }
  ],
  error: null,
  pagination: {
    page: 1,
    pageCount: 1,
    perPage: 100,
    totalRows: 1
  }
})

const multipleDocumentUsers = () => {
  return {
    data: [
      {
        entityId: 'individal_entity_id_1',
        roles: [
          'user'
        ],
        entityName: 'jane@example.com'
      },
      {
        entityId: 'individal_entity_id_2',
        roles: [
          'primary_user'
        ],
        entityName: 'john@example.com'
      }
    ],
    error: null
  }
}

module.exports = {
  singleResponse,
  notFound,
  multipleDocumentUsers
}
