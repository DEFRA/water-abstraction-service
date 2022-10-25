'use strict'

// We use promisify to wrap exec in a promise. This allows us to await it without resorting to using callbacks.
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const pkg = require('../../../package.json')

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
    version: pkg.version,
    commit: await _getCommitHash()
  }
}

exports.getInfo = getInfo
