const { get, uniqBy } = require('lodash');

const mapPoints = (points = []) => {
  return points.map(point => {
    return {
      id: point.point_detail.ID,
      name: point.point_detail.LOCAL_NAME
    };
  });
};

/**
 * Extracts all licence abstraction points across all purposes within a licence.
 */
const extractPoints = (licence = {}) => {
  const purposes = get(licence, 'purposes', []);

  const extractedPoints = purposes.reduce((points, purpose) => {
    const { purposePoints } = purpose;
    return [...points, ...mapPoints(purposePoints)];
  }, []);

  return uniqBy(extractedPoints, 'id');
};

module.exports = extractPoints;
