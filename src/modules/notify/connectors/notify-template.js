const notifyTemplateRepo = require('../../../controllers/notifytemplates').repository
const { findOne } = require('../../../lib/repository-helpers')

module.exports = {
  notifyTemplate: notifyTemplateRepo,
  findByMessageRef: (messageRef) => (findOne(notifyTemplateRepo, { message_ref: messageRef }))
}
