const gaugingStationsRepo = require('../../../controllers/gauging-stations');

/**
 * Searches gauging stations either by Wiski ID (if detected), Station Reference (if detected), or by its name
 * @param  {String}  query - format ID or full return ID
 * @return {Promise}       - resolves with array of returns
 */
const searchGaugingStations = async (query) => {
  const { rows: gaugingStationWithMatchingStationReference } = await gaugingStationsRepo.repository.find({
    station_reference: {
      $equals: query.toUpperCase()
    }
  });
  if (gaugingStationWithMatchingStationReference.length === 1) {
    return gaugingStationWithMatchingStationReference;
  }

  const { rows: gaugingStationWithMatchingWiskiId } = await gaugingStationsRepo.repository.find({
    wiski_id: {
      $equals: query.toUpperCase()
    }
  });
  if (gaugingStationWithMatchingWiskiId.length === 1) {
    return gaugingStationWithMatchingWiskiId;
  }

  const { rows: gaugingStationWithSimilarName } = await gaugingStationsRepo.repository.find({
    label: {
      $ilike: `%${query}%`
    }
  });
  if (gaugingStationWithSimilarName.length > 0) {
    return gaugingStationWithSimilarName.slice(0, 10); // Return no more than ten results
  }

  return [];
};

exports.searchGaugingStations = searchGaugingStations;
