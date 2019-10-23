require('dotenv').config();
const testMode = parseInt(process.env.TEST_MODE) === 1;
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);

module.exports = {

  frontEnds: {
    viewMyLicence: {
      baseUrl: process.env.BASE_URL || 'http://localhost:8000'
    },
    internal: {
      baseUrl: process.env.ADMIN_BASE_URL || 'http://localhost:8008'
    }
  },

  blipp: {
    showAuth: true
  },

  jwt: {
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: [ 'HS256' ] }
  },

  logger: {
    level: testMode ? 'info' : 'error',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  // 125 available db connections
  // 2 instances each with 2 cores running 5 applicatons that use
  // the database.
  // Therefore 125 / (2 x 2 x 5) = 6.25 connections per application pool.
  pg: {
    connectionString: process.env.DATABASE_URL,
    max: 8,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  },

  pgImport: {
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 30000,
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
    bucket: process.env.S3_BUCKET,
    proxy: process.env.PROXY
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

      returns_invitation_primary_user_email: 'b18195f7-7b83-4251-a6eb-22124f1dff87',
      returns_invitation_returns_agent_email: '24dade05-e020-4a85-a73f-64ccd0c4b9d8',
      returns_invitation_licence_holder_letter: '1d719f8c-fa6e-4ea8-ba5d-38bc7cca9285',
      returns_invitation_returns_to_letter: 'bceedf11-8dcc-4ec6-8570-11bb7d292f19',

      returns_reminder_primary_user_email: '25938d36-bea0-4fe4-af8e-28c86a5370b4',
      returns_reminder_returns_agent_email: '87a59772-d9a6-4d9d-b3a2-8d9dff808f86',
      returns_reminder_licence_holder_letter: '397bc706-2290-4b8b-b0ef-43083113f828',
      returns_reminder_returns_to_letter: '9145a31b-7618-4622-b266-7f28789d4191'
    }
  },

  services: {
    crm: process.env.CRM_URI || 'http://127.0.0.1:8002/crm/1.0',
    idm: process.env.IDM_URI || 'http://127.0.0.1:8003/idm/1.0',
    permits: process.env.PERMIT_URI || 'http://127.0.0.1:8004/API/1.0/',
    returns: process.env.RETURNS_URI || 'http://127.0.0.1:8006/returns/1.0',
    import: process.env.IMPORT_URI || 'http://127.0.0.1:8007/import/1.0'
  },

  isAcceptanceTestTarget
};
