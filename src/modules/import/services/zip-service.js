const path = require('path');
const helpers = require('../../../lib/helpers.js');
const { logger } = require('../../../logger');
const constants = require('../lib/constants');
const config = require('../../../../config');

const primaryPath = path.join(constants.LOCAL_TEMP_PATH, 'nald_dl.zip');
const secondaryPath = path.join(constants.LOCAL_TEMP_PATH, `${constants.CSV_DIRECTORY}.zip`);

/**
 *
 * @param {String} source - file
 * @param {String} destination - file
 * @param {String} [password] - password if encrypted
 */
const extractArchive = async (source, destination, password) => {
  let command = `7z x ${source} -o ${destination}`;
  if (password) {
    command += ` -p ${password}`;
  }
  await helpers.execCommand(command);
};

/**
 * Extracts files from zip downloaded from S3 bucket
 */
const extract = async () => {
  logger.info('Extracting data from NALD zip file');

  try {
    await extractArchive(primaryPath, constants.LOCAL_TEMP_PATH, config.import.zipPassword);
    await extractArchive(secondaryPath, constants.LOCAL_TEMP_PATH);
  } catch (err) {
    logger.error('Could not extract NALD zip', err);
    throw err;
  }
};

exports.extract = extract;
