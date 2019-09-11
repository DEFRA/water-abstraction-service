const { find } = require('lodash');

const compareRoles = (role1, role2) =>
  (role1 || '').toLowerCase() === (role2 || '').toLowerCase();

class ContactList {
  constructor (data = []) {
    this.contacts = data;
  }

  /**
   * Adds a contact to the list
   * @param {Contact} contact
   */
  add (contact) {
    this.contacts.push(contact);
  }

  /**
   * Gets first contact by role (if it exists)
   * @param  {String} role - the contact role
   * @return {Contact}      - the contact (if found)
   */
  getByRole (role) {
    return find(this.contacts, contact => compareRoles(contact.role, role));
  }

  /**
   * Get all contacts by role (if it exists)
   * @param  {String} role - the contact role
   * @return {Array<Contact>}      - the contacts (if found)
   */
  getAllByRole (role) {
    return this.contacts.filter(contact => compareRoles(contact.role, role));
  }

  /**
   * Get all contacts
   * @return {Array}
   */
  toArray () {
    return this.contacts;
  }
}

module.exports = ContactList;
