'use strict';

require('dotenv').config();
const testMode = parseInt(process.env.TEST_MODE) === 1;
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);
const crmUri = process.env.CRM_URI || 'http://127.0.0.1:8002/crm/1.0';

module.exports = {

  frontEnds: {
    viewMyLicence: {
      baseUrl: process.env.BASE_URL || 'http://localhost:8000'
    },
    internal: {
      baseUrl: process.env.ADMIN_BASE_URL || 'http://localhost:8008'
    }
  },

  billing: {
    supplementaryYears: 0
  },

  blipp: {
    showAuth: true
  },

  jwt: {
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: ['HS256'] }
  },

  logger: {
    level: testMode ? 'info' : 'error',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  // Database has 198 available connections
  //
  // Outside of development each process runs on 2 instances on 2 cores.
  // So there will be 4 connection pools per service but just 1 locally
  //
  // Allocations:
  //
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  // | Service                             | Local   | Local      | Non local | Non local  |
  // |                                     | process | connection | process   | connection |
  // |                                     | count   | count      | count     | count      |
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  // | water-abstraction-import            |       1 |         20 |         2 | (20)    10 |
  // | water-abstraction-permit-repository |       1 |         16 |         4 | (16)     4 |
  // | water-abstraction-returns           |       1 |         20 |         4 | (20)     5 |
  // | water-abstraction-service           |       2 | (100)   50 |         5 | (100)   20 |
  // | water-abstraction-tactical-crm      |       1 |         20 |         4 | (20)     5 |
  // | water-abstraction-tactical-idm      |       1 |         20 |         4 | (20)     5 |
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  // | TOTAL                               |       6 |        196 |        23 |        196 |
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  //
  pg: {
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === 'local' ? 50 : 20,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
  },

  pgBoss: {
    schema: 'water',
    application_name: process.env.SERVICE_NAME,
    newJobCheckIntervalSeconds: 5
  },

  s3: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: 'eu-west-1',
    bucket: process.env.S3_BUCKET
  },

  server: {
    port: 8001,
    router: {
      stripTrailingSlash: true
    }
  },

  testMode,

  licence: {
    regimeId: 1,
    typeId: 8
  },

  abstractionReform: {
    regimeId: 1,
    typeId: 10
  },

  version: '1.0',

  idm: {
    application: {
      externalUser: 'water_vml',
      internalUser: 'water_admin'
    }
  },

  crm: {
    waterRegime: '0434dc31-a34e-7158-5775-4694af7a60cf'
  },

  notify: {
    templates: {
      returns_invitation_letter: 'd31d05d3-66fe-4203-8626-22e63f9bccd6',
      email_change_verification_code_email: '1fd2e8f2-8cb9-4ed1-8fa6-691918c15430',
      email_change_email_in_use_email: 'adb02416-e9d3-4e05-a9cc-b24e25675672',
      new_internal_user_email: '45b79d3a-39f2-44cf-b8f9-012c952dbd92',

      // currently not in use
      returns_invitation_primary_user_email: 'b18195f7-7b83-4251-a6eb-22124f1dff87',
      returns_invitation_returns_agent_email: '24dade05-e020-4a85-a73f-64ccd0c4b9d8',
      returns_invitation_licence_holder_letter: '1d719f8c-fa6e-4ea8-ba5d-38bc7cca9285',
      returns_invitation_returns_to_letter: 'bceedf11-8dcc-4ec6-8570-11bb7d292f19',
      // currently not in use
      returns_reminder_primary_user_email: '25938d36-bea0-4fe4-af8e-28c86a5370b4',
      returns_reminder_returns_agent_email: '87a59772-d9a6-4d9d-b3a2-8d9dff808f86',
      returns_reminder_licence_holder_letter: '397bc706-2290-4b8b-b0ef-43083113f828',
      returns_reminder_returns_to_letter: '9145a31b-7618-4622-b266-7f28789d4191',

      // variants of return invitation for behavioural insights work
      returns_invitation_primary_user_email_control: '2fa7fc83-4df1-4f52-bccf-ff0faeb12b6f',
      returns_invitation_primary_user_email_bi_style: 'a4bf8001-cc25-4e66-a40f-a5ca735ac69f',
      returns_invitation_primary_user_email_social_norm: '4176ec3b-ffcd-4085-8972-aaa5902ba7a8',
      returns_invitation_primary_user_email_formal: '37da0d9f-5254-43c5-a3d2-abc4e91994b5',

      returns_invitation_returns_agent_email_control: '41c45bd4-8225-4d7e-a175-b48b613b5510',
      returns_invitation_returns_agent_email_bi_style: 'd4566779-67d8-4ce0-be07-014ed774d9d2',
      returns_invitation_returns_agent_email_social_norm: 'edb920ea-cc10-4764-ae07-16822cb9075c',
      returns_invitation_returns_agent_email_formal: '40e1691d-ddbe-4f41-badf-13690b33e258',

      returns_invitation_licence_holder_letter_control: '4fe80aed-c5dd-44c3-9044-d0289d635019',
      returns_invitation_licence_holder_letter_bi_style: '9a85085a-fcf3-4c0d-b6d6-925409433126',
      returns_invitation_licence_holder_letter_social_norm: '7fe2267d-0263-47a5-bbf2-620543d2764e',
      returns_invitation_licence_holder_letter_formal: '4a3bcd84-053e-4ce7-a66b-401f534fa0da',

      returns_invitation_returns_to_letter_control: '0e535549-99a2-44a9-84a7-589b12d00879',
      returns_invitation_returns_to_letter_bi_style: '505a785f-ee05-48c3-8b1b-0d0031d5ea72',
      returns_invitation_returns_to_letter_social_norm: '237fbb49-ce48-4338-a876-2d56d96dd3a0',
      returns_invitation_returns_to_letter_formal: '9c82e205-9566-4327-bebb-35c6ff9dead9',

      // variants of return reminders for behavioural insights work
      returns_reminder_primary_user_email_control: 'f1144bc7-8bdc-4e82-87cb-1a6c69445836',
      returns_reminder_primary_user_email_bi_style: '0b856cf8-b76d-4f12-8085-e57900f34557',
      returns_reminder_primary_user_email_social_norm: '71425894-deb2-40db-bb49-cc408d888bff',
      returns_reminder_primary_user_email_formal: '6bdd8ec1-49b8-4da3-af8d-07a806d4e436',

      returns_reminder_returns_agent_email_control: '038e1807-d1b5-4f09-a5a6-d7eee9030a7a',
      returns_reminder_returns_agent_email_bi_style: '6de9e5b3-f35e-441a-8314-50b6c04ab3b4',
      returns_reminder_returns_agent_email_social_norm: 'a10f019a-9ae8-46fa-abaf-eb8adbad4563',
      returns_reminder_returns_agent_email_formal: '8ed028f7-7179-4274-91d9-a27988b9be70',

      returns_reminder_licence_holder_letter_control: 'c01c808b-094b-4a3a-ab9f-a6e86bad36ba',
      returns_reminder_licence_holder_letter_bi_style: '25831f1e-9c9c-4e28-b0f3-97da5941fe9b',
      returns_reminder_licence_holder_letter_social_norm: '5c9f369e-5bc7-4ef7-8b1c-efea86d76d66',
      returns_reminder_licence_holder_letter_formal: 'e1fa5bb4-3c8d-4358-acac-aabb42fc198e',

      returns_reminder_returns_to_letter_control: 'e9f132c7-a550-4e18-a5c1-78375f07aa2d',
      returns_reminder_returns_to_letter_bi_style: '826140d7-562e-4d49-8bf8-37cc298a6661',
      returns_reminder_returns_to_letter_social_norm: 'f80bfa93-8afa-4aef-8f87-ec64d1cb5a58',
      returns_reminder_returns_to_letter_formal: '3e788afa-bc7d-4fa8-b7da-32472b5d0f55'
    }
  },

  services: {
    crm: crmUri,
    crm_v2: crmUri.replace('1.0', '2.0'),
    idm: process.env.IDM_URI || 'http://127.0.0.1:8003/idm/1.0',
    permits: process.env.PERMIT_URI || 'http://127.0.0.1:8004/API/1.0/',
    returns: process.env.RETURNS_URI || 'http://127.0.0.1:8006/returns/1.0',
    import: process.env.IMPORT_URI || 'http://127.0.0.1:8007/import/1.0',
    chargeModule: process.env.CHARGE_MODULE_ORIGIN,
    cognito: process.env.COGNITO_HOST
  },

  isAcceptanceTestTarget,

  cognito: {
    username: process.env.COGNITO_USERNAME,
    password: process.env.COGNITO_PASSWORD
  },

  proxy: process.env.PROXY
};
