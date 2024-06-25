'use strict'

// We use promisify to wrap exec in a promise. This allows us to await it without resorting to using callbacks.
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const _getTagReference = async () => {
  try {
    const { stdout, stderr } = await exec('git describe --always --tags')
    return stderr ? `ERROR: ${stderr}` : stdout.replace('\n', '')
  } catch (error) {
    return `ERROR: ${error.message}`
  }
}

const _getCommitHash = async () => {
  try {
    const { stdout, stderr } = await exec('git rev-parse HEAD')
    return stderr ? `ERROR: ${stderr}` : stdout.replace('\n', '')
  } catch (error) {
    return `ERROR: ${error.message}`
  }
}

const getInfo = async () => {
  return {
    version: await _getTagReference(),
    commit: await _getCommitHash()
  }
}

exports.getInfo = getInfo
