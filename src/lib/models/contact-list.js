const { find } = require('lodash');

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
   * Gets a contact by role (if it exists)
   * @param  {String} role - the contact role
   * @return {Contact}      - the contact (if found)
   */
  getByRole (role) {
    return find(this.contacts, { role });
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
