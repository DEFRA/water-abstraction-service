'use strict'

const normaliseString = str => (str || '').trim().toLowerCase()

const compareRoles = (role1, role2) =>
  normaliseString(role1) === normaliseString(role2)

class ContactList {
  constructor (data = []) {
    this.contacts = data
  }

  /**
   * Adds a contact to the list
   * @param {Contact} contact
   */
  add (contact) {
    this.contacts.push(contact)
  }

  /**
   * Gets first contact by role (if it exists)
   * @param  {String} role - the contact role
   * @return {Contact}      - the contact (if found)
   */
  getByRole (role) {
    return this.contacts.find(contact => compareRoles(contact.role, role))
  }

  /**
   * Get all contacts by role (if it exists)
   * @param  {String} role - the contact role
   * @return {Array<Contact>}      - the contacts (if found)
   */
  getAllByRole (role) {
    return this.contacts.filter(contact => compareRoles(contact.role, role))
  }

  /**
   * Get all contacts
   * @return {Array}
   */
  toArray () {
    return this.contacts
  }
}

module.exports = ContactList
