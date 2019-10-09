const Lab = require('@hapi/lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');

const mappers = require('../../../../src/modules/charge-versions/lib/mappers');

const chargeVersion = {
  charge_version_id: 'b58fd6d2-40b9-4ab8-a860-82eeb218ecdd'
};

const chargeElements = [{
  charge_element_id: '156e4ef4-c975-4ccb-8286-3c2f82a6c9dc'
}, {
  charge_element_id: 'c24a65cc-1a66-45bd-b55e-a2d7d0473988'
}];

const chargeAgreements = [{
  charge_agreement_id: '57e52307-e0a2-4df2-9640-aa4c73d1103a',
  charge_element_id: 'c24a65cc-1a66-45bd-b55e-a2d7d0473988'
}];

experiment('./src/modules/charge-versions/lib/mappers.js', () => {
  experiment('mapRow', () => {
    test('converts object keys to camel case', async () => {
      const result = mappers.mapRow(chargeVersion);
      expect(result).to.equal({
        chargeVersionId: 'b58fd6d2-40b9-4ab8-a860-82eeb218ecdd'
      });
    });
  });

  experiment('mapRows', () => {
    test('converts object keys to camel case in every row', async () => {
      const result = mappers.mapRows(chargeElements);
      expect(result).to.equal([{
        chargeElementId: '156e4ef4-c975-4ccb-8286-3c2f82a6c9dc'
      }, {
        chargeElementId: 'c24a65cc-1a66-45bd-b55e-a2d7d0473988'
      }]);
    });
  });

  experiment('mapElement', () => {
    test('when source is kielder, eiuc source is other', async () => {
      const ele = mappers.mapElement({ source: 'kielder' });
      expect(ele.eiucSource).to.equal('other');
    });
    test('when source is supported, eiuc source is other', async () => {
      const ele = mappers.mapElement({ source: 'supported' });
      expect(ele.eiucSource).to.equal('other');
    });
    test('when source is unsupported, eiuc source is other', async () => {
      const ele = mappers.mapElement({ source: 'unsupported' });
      expect(ele.eiucSource).to.equal('other');
    });
    test('when source is tidal, eiuc source is tidal', async () => {
      const ele = mappers.mapElement({ source: 'tidal' });
      expect(ele.eiucSource).to.equal('tidal');
    });
  });

  experiment('mapChargeVersion', () => {
    test('maps a charge version, elements and agreements to an object', async () => {
      const result = mappers.mapChargeVersion(chargeVersion, chargeElements,
        chargeAgreements);

      expect(result.chargeVersionId).to.equal('b58fd6d2-40b9-4ab8-a860-82eeb218ecdd');

      expect(result.chargeElements[0].chargeElementId)
        .to.equal('156e4ef4-c975-4ccb-8286-3c2f82a6c9dc');
      expect(result.chargeElements[0].chargeAgreements)
        .to.equal([]);

      expect(result.chargeElements[1].chargeElementId)
        .to.equal('c24a65cc-1a66-45bd-b55e-a2d7d0473988');
      expect(result.chargeElements[1].chargeAgreements[0].chargeAgreementId)
        .to.equal('57e52307-e0a2-4df2-9640-aa4c73d1103a');
      expect(result.chargeElements[1].chargeAgreements[0].chargeElementId)
        .to.equal('c24a65cc-1a66-45bd-b55e-a2d7d0473988');
    });
  });
});
