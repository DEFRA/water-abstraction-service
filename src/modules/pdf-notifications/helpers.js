const path = require('path');

/**
 * Gets the relevant view template path given a message ref
 * for PDF messages
 * @param {String} messageRef
 * @return {String} view path
 */
const getViewPath = (messageRef) => {
  const view = messageRef.replace(/^pdf\./i, '');
  return path.join('pdf-notifications/', view);
};

module.exports = {
  getViewPath
};
