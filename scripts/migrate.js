'use strict'

require('dotenv').config()

// We use promisify to wrap exec in a promise. This allows us to await it without resorting to using callbacks.
const util = require('util')
const exec = util.promisify(require('child_process').exec)

async function run () {
  const databaseUrl = process.env.NODE_ENV !== 'test' ? process.env.DATABASE_URL : process.env.TEST_DATABASE_URL

  try {
    const { stdout, stderr } = await exec(`export DATABASE_URL=${databaseUrl} && db-migrate up --verbose`)

    const output = stderr ? `ERROR: ${stderr}` : stdout.replace('\n', '')
    console.log(output)

    process.exit(stderr ? 1 : 0)
  } catch (error) {
    console.log(`ERROR: ${error.message}`)

    process.exit(1)
  }
}

run()
