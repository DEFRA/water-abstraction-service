const gaugingStationsRepo = require('../../../lib/connectors/repos/gauging-stations');

/**
 * Searches gauging stations either by Wiski ID (if detected), Station Reference (if detected), or by its name
 * @param  {String}  query - format ID or full return ID
 * @return {Promise}       - resolves with array of returns
 */
const searchGaugingStations = async query => {
  const gaugingStationWithMatchingStationReference = await gaugingStationsRepo.findOneByStationRef(query);
  const gaugingStationWithMatchingWiskiId = await gaugingStationsRepo.findOneByWiskiId(query);
  const gaugingStationWithSimilarName = await gaugingStationsRepo.findAllByPartialNameMatch(query);

  if (gaugingStationWithMatchingStationReference) {
    return [gaugingStationWithMatchingStationReference];
  } else if (gaugingStationWithMatchingWiskiId) {
    return [gaugingStationWithMatchingWiskiId];
  } else if (gaugingStationWithSimilarName && gaugingStationWithSimilarName.length > 0) {
    return gaugingStationWithSimilarName.slice(0, 10); // Return no more than ten results
  } else {
    return [];
  }
};

exports.searchGaugingStations = searchGaugingStations;
