const Event = require('../../../lib/models/event');
const eventService = require('../../../lib/services/events');

const createAddressEvent = (options) => {
  const event = new Event();
  event.type = 'address:create';
  event.issuer = options.issuer;
  event.metadata = { address: options.address };
  event.status = 'created';
  return eventService.create(event);
};

exports.createAddressEvent = createAddressEvent;
