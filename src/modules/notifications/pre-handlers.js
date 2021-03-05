'use strict';

const Boom = require('@hapi/boom');

const eventsService = require('../../lib/services/events');

const isValidEvent = event =>
  event && event.type === 'notification';

const getEvent = async request => {
  const { eventId } = request.params;
  const event = await eventsService.findOne(eventId);
  return isValidEvent(event) ? event : Boom.notFound(`Notification event ${eventId} not found`);
};

exports.getEvent = getEvent;
