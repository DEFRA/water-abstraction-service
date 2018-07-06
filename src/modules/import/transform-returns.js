const {
  getFormats,
  getFormatPurposes,
  getFormatPoints,
  getLogs,
  getLines
} = require('./lib/nald-returns-queries.js');

const buildReturnsPacket = async (licenceNumber) => {
  const formats = await getFormats(licenceNumber);

  for (let format of formats) {
    let logs = await getLogs(format.ID, format.FGAC_REGION_CODE);
    for (let log of logs) {
      log.lines = await getLines(format.ID, format.FGAC_REGION_CODE, log.DATE_FROM);
    }

    format.purposes = await getFormatPurposes(format.ID, format.FGAC_REGION_CODE);
    format.points = await getFormatPoints(format.ID, format.FGAC_REGION_CODE);
    format.logs = logs;
  }

  return formats;
};

module.exports = {
  buildReturnsPacket
};
