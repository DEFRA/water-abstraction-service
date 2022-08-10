'use strict'

const postRegisterWorker = async (request, h) => {
  const { jobName } = request.payload
  console.log(`🔨 Worker registered: ${jobName}`)

  return h.response().code(201)
}

module.exports = {
  postRegisterWorker
}
