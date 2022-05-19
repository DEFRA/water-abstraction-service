'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const User = require('../../../src/lib/models/user')

experiment('lib/models/user', () => {
  experiment('construction', () => {
    test('can be passed no initial values', async () => {
      const user = new User()
      expect(user.id).to.be.undefined()
      expect(user.email).to.be.undefined()
    })

    test('can be passed an id', async () => {
      const user = new User(1234)
      expect(user.id).to.equal(1234)
      expect(user.email).to.be.undefined()
    })

    test('can be passed an email', async () => {
      const user = new User(1234, 'test@example.com')
      expect(user.id).to.equal(1234)
      expect(user.email).to.equal('test@example.com')
    })
  })

  experiment('.id', () => {
    test('can be set to a positive integer', async () => {
      const user = new User()
      user.id = 7593
      expect(user.id).to.equal(7593)
    })

    test('throws an error if not set to a positive integer', async () => {
      const user = new User()
      const func = () => {
        user.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.email', () => {
    test('can be set to a valid email address', async () => {
      const user = new User()
      user.email = 'test@example.com'
      expect(user.email).to.equal('test@example.com')
    })

    test('throws an error if string is not a valid email', async () => {
      const user = new User()
      const func = () => {
        user.email = 'not-an-email'
      }
      expect(func).to.throw()
    })
  })
})
