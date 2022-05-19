'use-strict'

const months = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const mapReturnsDataByCycle = (data, returnCycle) => {
  return {
    ...returnCycle,
    ...data,
    total: data.internalOnTime + data.internalLate + data.externalOnTime + data.externalLate
  }
}

const mapReturnsDataMonthly = data => {
  return data.reduce((acc, row) => {
    acc.totals.allTime += row.returnCount
    if (row.currentYear) {
      acc.totals.ytd += row.returnCount
      // row.month - 1 to mamtch the string array of months starting with index of 0
      acc.monthly.push({ ...row, month: months[(row.month - 1)], currentYear: row.year })
    }
    return acc
  }, { totals: { allTime: 0, ytd: 0 }, monthly: [] })
}

/**
 * Function to compare 2 integer values in the list of objects to calculate the percentage difference
 * @param {array} data a list of monthly data with integer values
 * @param {integer} index integer value to use with the data array of objects to compare the current monthly object with the next monthly object in the array
 * @param {string} key string value to identify which property of the object in the aray to work with
 */
const percentChange = (data, index, key) => {
  return index < (data.length + 1)
    ? (data[[index]][key] - data[(index + 1)][key]) /
            (data[(index + 1)][key] < 1 ? 1 : data[(index + 1)][key]) * 100
    : 0
}

const mapLicenceNamesData = data => {
  return data.reduce((acc, row, index) => {
    acc.totals.allTime = acc.totals.allTime + row.named + row.renamed
    acc.totals.ytd = acc.totals.ytd + (row.currentYear ? row.named + row.renamed : 0)
    if (row.currentYear) {
      acc.monthly.push(
        {
          ...row,
          month: months[row.month - 1],
          year: row.year,
          namedChange: index < (data.length - 1) ? percentChange(data, index, 'named') : 0,
          renamedChange: index < (data.length - 1) ? percentChange(data, index, 'renamed') : 0
        }
      )
    }
    return acc
  }, { totals: { allTime: 0, ytd: 0 }, monthly: [] })
}

module.exports.mapLicenceNamesData = mapLicenceNamesData
module.exports.mapReturnsDataByCycle = mapReturnsDataByCycle
module.exports.mapReturnsDataMonthly = mapReturnsDataMonthly
