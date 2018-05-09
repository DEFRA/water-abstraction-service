/**
 * Combines data from various sources: task config, template params, contacts,
 * transformed licence data, and returns an array of messages to send including
 * the rendered template content
 * @module modules/notifications/task-config-loader
 */

const nunjucks = require('nunjucks');

/**
 * @param {Object} taskConfig - an object of task config fata from the water service DB
 * @param {Object} params - user-supplied template variables
 * @param {Array} contacts - array of contacts with licence header data
 * @param {Object} licences - list of licences keyed by licence number
 */
function renderTemplates (taskConfig, params, contacts, licences) {
  return contacts.map((contact) => {
    const licenceList = contact.licences.map((licence) => {
      return licences[licence.system_external_id];
    });

    // Assemble view data for passing to Nunjucks template
    const viewContext = {
      taskConfig,
      params,
      contact,
      licences: licenceList
    };

    const output = nunjucks.renderString(taskConfig.config.content.default, viewContext);

    return {
      contact,
      output
    };
  });
}

module.exports = renderTemplates;
