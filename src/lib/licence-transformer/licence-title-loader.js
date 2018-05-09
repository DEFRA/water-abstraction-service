const fs = require('fs');
const Promise = require('bluebird');
const readFile = Promise.promisify(fs.readFile);
const csvParse = Promise.promisify(require('csv-parse'));

/**
 * Loads and transforms licence condition title data from
 * local CSV file
 * Caches data within object to avoid repeated file loads
 * @module lib/licence-title-loader
 * @class LicenceTitleLoader
 */
class LicenceTitleLoader {
  constructor () {
    this.data = null;
  }

  /**
   * Loads licence condition title data from CSV file
   * Transforms titles to sentence case
   * @return {Array} array of data from CSV file
   */
  async load () {
    if (this.data) {
      return this.data;
    }

    // Read condition titles from CSV
    const str = await readFile('./data/condition_titles.csv');
    const data = await csvParse(str, {columns: true});

    // Sentence case all titles
    const dataTransformed = data.map((row) => {
      const {code, subCode, displayTitle, parameter1Label, parameter2Label} = row;
      return {
        code,
        subCode,
        displayTitle,
        parameter1Label,
        parameter2Label
      };
    });

    return dataTransformed;
  }
}

module.exports = LicenceTitleLoader;
