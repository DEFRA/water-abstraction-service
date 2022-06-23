'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const Pagination = require('../../../src/lib/models/pagination')

experiment('lib/models/pagination', () => {
  let pagination

  beforeEach(async () => {
    pagination = new Pagination()
  })

  experiment('.page', () => {
    test('can be set to a positive integer', async () => {
      pagination.page = 5
      expect(pagination.page).to.equal(5)
    })

    test('cannot be set to 0', async () => {
      const func = () => { pagination.page = 0 }
      expect(func).to.throw()
    })

    test('cannot be negative', async () => {
      const func = () => { pagination.page = -5 }
      expect(func).to.throw()
    })

    test('cannot be decimal ', async () => {
      const func = () => { pagination.page = 15.5 }
      expect(func).to.throw()
    })

    test('cannot be null', async () => {
      const func = () => { pagination.page = null }
      expect(func).to.throw()
    })
  })

  experiment('.perPage', () => {
    test('can be set to a positive integer', async () => {
      pagination.perPage = 5
      expect(pagination.perPage).to.equal(5)
    })

    test('cannot be set to 0', async () => {
      const func = () => { pagination.perPage = 0 }
      expect(func).to.throw()
    })

    test('cannot be negative', async () => {
      const func = () => { pagination.perPage = -5 }
      expect(func).to.throw()
    })

    test('cannot be decimal ', async () => {
      const func = () => { pagination.perPage = 15.5 }
      expect(func).to.throw()
    })

    test('cannot be null', async () => {
      const func = () => { pagination.perPage = null }
      expect(func).to.throw()
    })
  })

  experiment('.totalRows', () => {
    test('can be set to a positive integer', async () => {
      pagination.totalRows = 5
      expect(pagination.totalRows).to.equal(5)
    })

    test('can be set to 0', async () => {
      pagination.totalRows = 0
      expect(pagination.totalRows).to.equal(0)
    })

    test('cannot be negative', async () => {
      const func = () => { pagination.totalRows = -5 }
      expect(func).to.throw()
    })

    test('cannot be decimal ', async () => {
      const func = () => { pagination.totalRows = 15.5 }
      expect(func).to.throw()
    })

    test('cannot be null', async () => {
      const func = () => { pagination.totalRows = null }
      expect(func).to.throw()
    })
  })

  experiment('.pageCount', () => {
    test('can be set to a positive integer', async () => {
      pagination.pageCount = 5
      expect(pagination.pageCount).to.equal(5)
    })

    test('can be set to 0', async () => {
      pagination.pageCount = 0
      expect(pagination.pageCount).to.equal(0)
    })

    test('cannot be negative', async () => {
      const func = () => { pagination.pageCount = -5 }
      expect(func).to.throw()
    })

    test('cannot be decimal ', async () => {
      const func = () => { pagination.pageCount = 15.5 }
      expect(func).to.throw()
    })

    test('cannot be null', async () => {
      const func = () => { pagination.pageCount = null }
      expect(func).to.throw()
    })
  })
})
