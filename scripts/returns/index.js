const program = require('commander')
const config = require('../../config')
const { throwIfError } = require('@envage/hapi-pg-rest-api')
const fs = require('fs')
const path = require('path')

const {
  saveReturn,
  deleteReturn,
  loadReturn,
  getAllTestReturns,
  deleteAllReturns
} = require('./data-access')

const testReturn = require('./test-return')

const printJson = obj => console.log(JSON.stringify(obj, null, 2))

const printJsonAndExit = json => {
  printJson(json)
  process.exit()
}

const ERROR_CODES = {
  NOT_IN_ENV_DIR: 2,
  NOT_TEST_MODE: 3
}

const createTestReturn = async existingReturnId => {
  const { data: existingReturn, error } = await loadReturn(existingReturnId)
  throwIfError(error)

  const ret = testReturn.create(existingReturn)
  return saveReturn(ret)
}

const logErrorAndExit = (err, exitCode = 1) => {
  console.error(err)
  process.exit(1)
}

const validateCwd = () => {
  if (!fs.existsSync(path.join(process.cwd(), '.env'))) {
    const error = 'Must be run in the same working dir as the .env file'
    logErrorAndExit({ error }, ERROR_CODES.NOT_IN_ENV_DIR)
  }
}

const validateTestMode = () => {
  if (!config.testMode) {
    const error = 'Cannot use this tool outside of test mode'
    console.error({ error }, ERROR_CODES.NOT_TEST_MODE)
  };
}

validateCwd()
validateTestMode()

program
  .command('create <return-id>')
  .description('Creates a test return by copying the given return id')
  .action(returnId => {
    return createTestReturn(returnId)
      .then(response => printJsonAndExit({ return: response.data }))
      .catch(logErrorAndExit)
  })

program
  .command('delete <return-id>')
  .description('Deletes a test return')
  .action(returnId => {
    return deleteReturn(returnId)
      .then(printJsonAndExit)
      .catch(logErrorAndExit)
  })

program
  .command('delete-all')
  .description('Deletes any test returns that are saved')
  .action(() => {
    return deleteAllReturns()
      .then(response => printJsonAndExit({ deleted: response }))
      .catch(logErrorAndExit)
  })

program
  .command('show')
  .option('-v --verbose', ' Show the full return object')
  .description('Shows any returns that have been made for testing')
  .action(async cmd => {
    const returns = await getAllTestReturns()

    const output = cmd.verbose
      ? { returns }
      : { returns: returns.map(r => r.return_id) }

    printJsonAndExit(output)
  })

program.parse(process.argv)

if (program.args.length === 0) {
  program.help()
}
