'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { getRecipients } = require('../../../../../../src/modules/batch-notifications/config/paper-returns/lib/get-recipients');
const returnsService = require('../../../../../../src/lib/services/returns/api-connector');
const scheduledNotificationService = require('../../../../../../src/lib/services/scheduled-notifications');

experiment('modules/batch-notifications/config/paper-returns/lib/get-recipients', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getRecipients', () => {
    experiment('for two recipients and three returns', () => {
      let eventData;
      let returnData;

      beforeEach(async () => {
        returnData = {
          return_id: 'return-one',
          regime: 'water',
          licence_type: 'abstraction',
          licence_ref: '123/123',
          start_date: '2000-01-01',
          end_date: '2100-01-01',
          returns_frequency: 'day',
          status: 'due',
          source: 'NALD',
          metadata: {
            nald: {
              areaCode: 'test-area-code',
              formatId: 12345678,
              regionCode: 1,
              periodEndDay: '31',
              periodEndMonth: '12',
              periodStartDay: '1',
              periodStartMonth: '1'
            },
            points: [
              {
                name: 'point-name',
                ngr1: 'test-ngr1',
                ngr2: 'test-ngr2',
                ngr3: 'test-ngr3',
                ngr4: 'test-ngr4'
              }
            ],
            isFinal: false,
            version: 1,
            isSummer: false,
            isUpload: true,
            purposes: [
              {
                alias: 'test-purpose-1-alias',
                primary: { code: 'A', description: 'test-purpose-1-primary-desc' },
                secondary: { code: 'ABC', description: 'test-purpose-1-secondary-desc' },
                tertiary: { code: '100', description: 'test-purpose-1-tertiary-desc' }
              },
              {
                alias: 'test-purpose-2-alias',
                primary: { code: 'A', description: 'test-purpose-2-primary-desc' },
                secondary: { code: 'ABC', description: 'test-purpose-2-secondary-desc' },
                tertiary: { code: '100', description: 'test-purpose-2-tertiary-desc' }
              }
            ],
            isCurrent: true,
            description: 'test-desc',
            isTwoPartTariff: false
          },
          created_at: '2000-05-01T00:00:00.000Z',
          updated_at: '2000-05-01T00:00:00.000Z',
          received_date: '2001-01-01',
          return_requirement: '12345678',
          due_date: '2001-01-01',
          under_query: false,
          under_query_comment: null
        };

        eventData = {
          ev: {
            id: '11111111-1111-1111-1111-111111111111',
            metadata: {
              options: {
                forms: [
                  {
                    company: {
                      name: 'test-company-name',
                      type: 'person'
                    },
                    address: {
                      addressLine1: 'add-line-1',
                      addressLine2: 'add-line-2',
                      addressLine3: 'add-line-3',
                      addressLine4: 'add-line-4',
                      town: 'test-town',
                      county: 'test-county',
                      country: 'test-country',
                      postcode: 'test-post-code'
                    },
                    contact: {
                      title: 'test-contact-title',
                      firstName: 'test-contact-first-name',
                      lastName: 'test-contact-last-name',
                      initials: 'test-contact-initials'
                    },
                    returns: [
                      { returnId: 'return-one' },
                      { returnId: 'return-two' }
                    ]
                  },
                  {
                    company: {
                      name: 'test-company-name',
                      type: 'person'
                    },
                    address: {
                      addressLine1: 'add-line-1',
                      addressLine2: 'add-line-2',
                      addressLine3: 'add-line-3',
                      addressLine4: 'add-line-4',
                      town: 'test-town',
                      county: 'test-county',
                      country: 'test-country',
                      postcode: 'test-post-code'
                    },
                    contact: {
                      title: 'test-contact-title',
                      firstName: 'test-contact-first-name',
                      lastName: 'test-contact-last-name',
                      initials: 'test-contact-initials'
                    },
                    returns: [
                      { returnId: 'return-three' }
                    ]
                  }
                ]
              }
            }
          }
        };

        sandbox.stub(returnsService, 'getReturnById').resolves(returnData);
        sandbox.stub(scheduledNotificationService, 'createScheduledNotification').resolves();

        await getRecipients(eventData);
      });

      test('three notifications are saved', async () => {
        expect(scheduledNotificationService.createScheduledNotification.callCount).to.equal(3);
      });

      experiment('the notifications have', () => {
        test('the expected message ref', async () => {
          const [notification] = scheduledNotificationService.createScheduledNotification.lastCall.args;
          expect(notification.messageRef).to.equal('pdf.return_form');
        });

        test('the expected message type', async () => {
          const [notification] = scheduledNotificationService.createScheduledNotification.lastCall.args;
          expect(notification.messageType).to.equal('letter');
        });

        test('the event id from the event data', async () => {
          const [notification] = scheduledNotificationService.createScheduledNotification.lastCall.args;
          expect(notification.eventId).to.equal(eventData.ev.id);
        });

        experiment('a personalisation object which contains', () => {
          let personalisation;

          beforeEach(async () => {
            const [notification] = scheduledNotificationService.createScheduledNotification.lastCall.args;
            personalisation = notification.personalisation;
          });

          test('address_line_1', async () => {
            expect(personalisation.address_line_1).to.equal('add-line-1');
          });

          test('address_line_2', async () => {
            expect(personalisation.address_line_2).to.equal('add-line-2');
          });

          test('address_line_3', async () => {
            expect(personalisation.address_line_3).to.equal('add-line-3');
          });

          test('address_line_4', async () => {
            expect(personalisation.address_line_4).to.equal('add-line-4');
          });

          test('area_code', async () => {
            expect(personalisation.area_code).to.equal('test-area-code');
          });

          test('county', async () => {
            expect(personalisation.county).to.equal('test-county');
          });

          test('country', async () => {
            expect(personalisation.country).to.equal('test-country');
          });

          test('due_date', async () => {
            expect(personalisation.due_date).to.equal('2001-01-01');
          });

          test('end_date', async () => {
            expect(personalisation.end_date).to.equal('2100-01-01');
          });

          test('forename', async () => {
            expect(personalisation.forename).to.equal('test-contact-first-name');
          });

          test('format_id', async () => {
            expect(personalisation.format_id).to.equal(12345678);
          });

          test('initials', async () => {
            expect(personalisation.initials).to.equal('test-contact-initials');
          });

          test('is_two_part_tariff', async () => {
            expect(personalisation.is_two_part_tariff).to.equal(false);
          });

          test('licence_ref', async () => {
            expect(personalisation.licence_ref).to.equal('123/123');
          });

          test('postcode', async () => {
            expect(personalisation.postcode).to.equal('test-post-code');
          });

          test('purpose', async () => {
            expect(personalisation.purpose).to.equal('test-purpose-1-tertiary-desc, test-purpose-2-tertiary-desc');
          });

          test('qr_url', async () => {
            expect(personalisation.qr_url).to.equal('return-one');
          });

          test('region_code', async () => {
            expect(personalisation.region_code).to.equal(1);
          });

          test('returns_frequency', async () => {
            expect(personalisation.returns_frequency).to.equal('day');
          });

          test('salutation', async () => {
            expect(personalisation.salutation).to.equal('test-contact-title');
          });

          test('site_description', async () => {
            expect(personalisation.site_description).to.equal('test-desc');
          });

          test('start_date', async () => {
            expect(personalisation.start_date).to.equal('2000-01-01');
          });

          test('town', async () => {
            expect(personalisation.town).to.equal('test-town');
          });
        });
      });

      experiment('when the company is an organisation', () => {
        test('the company name is used in the personalisation', async () => {
          eventData.ev.metadata.options.forms[0].company.type = 'organisation';
          eventData.ev.metadata.options.forms[1].company.type = 'organisation';
          await getRecipients(eventData);

          const [notification] = scheduledNotificationService.createScheduledNotification.lastCall.args;

          expect(notification.personalisation.name).to.equal('test-company-name');
          expect(notification.personalisation.forename).to.equal(undefined);
          expect(notification.personalisation.initials).to.equal(undefined);
          expect(notification.personalisation.salutation).to.equal(undefined);
        });
      });

      experiment('when the company is a person', () => {
        test('the contact details are used in the personalisation', async () => {
          const [notification] = scheduledNotificationService.createScheduledNotification.lastCall.args;

          expect(notification.personalisation.name).to.equal('test-contact-last-name');
          expect(notification.personalisation.forename).to.equal('test-contact-first-name');
          expect(notification.personalisation.initials).to.equal('test-contact-initials');
          expect(notification.personalisation.salutation).to.equal('test-contact-title');
        });
      });
    });
  });
});
