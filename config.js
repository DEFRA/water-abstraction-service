'use strict'

require('dotenv').config()
const testMode = parseInt(process.env.TEST_MODE) === 1

const environment = process.env.ENVIRONMENT
const isProduction = environment === 'prd'
const isBackground = process.env.name === 'service-background'

const srocStartDate = new Date('2022-04-01')
const isSrocLive = !isProduction && new Date() >= srocStartDate

const crmUri = process.env.CRM_URI || 'http://127.0.0.1:8002/crm/1.0'
const isTlsConnection = (process.env.REDIS_HOST || '').includes('aws')
const isRedisLazy = !!process.env.LAZY_REDIS

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
    supplementaryYears: 5,
    createChargeJobConcurrency: 1,
    processChargeVersionYearsJobConcurrency: 2,
    prepareTransactionsJobConcurrency: 1,
    // Some billing logic is handled differently depending on whether the
    // transaction is pre/post NALD switchover date
    naldSwitchOverDate: process.env.BILLING_GO_LIVE_DATE || '2021-06-10',
    // The grace period (in days) following the return due date during which time
    // the submitted return will be considered for billing
    returnsGracePeriod: process.env.RETURNS_GRACE_PERIOD || 21,
    // The date SROC goes live
    isSrocLive,
    srocStartDate,
    alcsEndYear: 2022
  },

  blipp: {
    showAuth: true
  },

  jobs: {
    batchNotifications: {
      requestEvent: 60000, // 1 minute
      checkStatus: 15000, // 15 seconds
      sendMessages: 15000 // 15 seconds
    }
  },

  jwt: {
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: ['HS256'] }
  },

  // This config is specifically for hapi-pino which was added to replace the deprecated (and noisy!) hapi/good. At
  // some point all logging would go through this. But for now, it just covers requests & responses
  log: {
    // Credit to https://stackoverflow.com/a/323546/6117745 for how to handle
    // converting the env var to a boolean
    logInTest: (String(process.env.LOG_IN_TEST) === 'true') || false,
    level: process.env.WRLS_LOG_LEVEL || 'warn'
  },

  // This config is used by water-abstraction-helpers and its use of Winston and Airbrake. Any use of `logger.info()`,
  // for example, is built on this config.
  logger: {
    level: process.env.WRLS_LOG_LEVEL || 'warn',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  pg: {
    connectionString: process.env.NODE_ENV !== 'test' ? process.env.DATABASE_URL : process.env.TEST_DATABASE_URL,
    max: 36
  },

  pgBoss: {
    schema: 'water',
    application_name: process.env.SERVICE_NAME,
    newJobCheckIntervalSeconds: 10
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
  serverBackground: {
    port: 8012,
    router: {
      stripTrailingSlash: true
    }
  },

  testMode,
  environment,
  isProduction,
  isBackground,

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
      email_change_verification_code_email: '1fd2e8f2-8cb9-4ed1-8fa6-691918c15430',
      email_change_email_in_use_email: 'adb02416-e9d3-4e05-a9cc-b24e25675672',
      new_internal_user_email: '45b79d3a-39f2-44cf-b8f9-012c952dbd92',
      nald_entity_changes_detected: 'b5d29621-e30d-4dc8-a6eb-11ab075d7a0c',

      water_abstraction_alert_reduce_warning: '27499bbd-e854-4f13-884e-30e0894526b6',
      water_abstraction_alert_reduce_or_stop_warning: '8c77274f-6a61-46a5-82d8-66863320d608',
      water_abstraction_alert_stop_warning: '7ab10c86-2c23-4376-8c72-9419e7f982bb',
      water_abstraction_alert_reduce: 'fafe7d77-7710-46c8-b870-3b5c1e3816d2',
      water_abstraction_alert_reduce_or_stop: '2d81eaa7-0c34-463b-8ac2-5ff37d5bd800',
      water_abstraction_alert_stop: 'c2635893-0dd7-4fff-a152-774707e2175e',
      water_abstraction_alert_resume: 'ba6b11ad-41fc-4054-87eb-7e9a168ceec2',

      water_abstraction_alert_reduce_warning_email: '6ec7265d-8ebb-4217-a62b-9bf0216f8c9f',
      water_abstraction_alert_reduce_or_stop_warning_email: 'bf32327a-f170-4854-8abb-3068aee9cdec',
      water_abstraction_alert_stop_warning_email: 'a51ace39-3224-4c18-bbb8-c803a6da9a21',
      water_abstraction_alert_reduce_email: 'd94bf110-b173-4f77-8e9a-cf7b4f95dc00',
      water_abstraction_alert_reduce_or_stop_email: '4ebf29e1-f819-4d88-b7e4-ee47df302b9a',
      water_abstraction_alert_stop_email: 'd7468ba1-ac65-42c4-9785-8998f9c34e01',
      water_abstraction_alert_resume_email: '5eae5e5b-4f9a-4e2e-8d1e-c8d083533fbf',

      // // Invitations
      returns_invitation_primary_user_email: '2fa7fc83-4df1-4f52-bccf-ff0faeb12b6f',
      returns_invitation_returns_agent_email: '41c45bd4-8225-4d7e-a175-b48b613b5510',

      returns_invitation_licence_holder_letter: '4fe80aed-c5dd-44c3-9044-d0289d635019',
      returns_invitation_returns_to_letter: '0e535549-99a2-44a9-84a7-589b12d00879',

      // Reminders
      returns_reminder_primary_user_email: 'f1144bc7-8bdc-4e82-87cb-1a6c69445836',
      returns_reminder_returns_agent_email: '038e1807-d1b5-4f09-a5a6-d7eee9030a7a',

      returns_reminder_licence_holder_letter: 'c01c808b-094b-4a3a-ab9f-a6e86bad36ba',
      returns_reminder_returns_to_letter: 'e9f132c7-a550-4e18-a5c1-78375f07aa2d'
    }
  },
  import: {
    returns: { importYears: process.env.IMPORT_RETURNS_YEARS || 3 },
    gaugingStationsSyncFrequencyInMS: 21600000,
    chargeCategoriesSyncFrequencyInMS: 21600000,
    digitiseToLVPCSyncCronExp: '0 18 * * *',
    digitiseToLicenceGaugingStationsCronExp: '0 18 * * *',
    zipPassword: process.env.NALD_ZIP_PASSWORD
  },
  services: {
    crm: crmUri,
    crm_v2: crmUri.replace('1.0', '2.0'),
    idm: process.env.IDM_URI || 'http://127.0.0.1:8003/idm/1.0',
    permits: process.env.PERMIT_URI || 'http://127.0.0.1:8004/API/1.0/',
    returns: process.env.RETURNS_URI || 'http://127.0.0.1:8006/returns/1.0',
    import: process.env.IMPORT_URI || 'http://127.0.0.1:8007/import/1.0',
    system: process.env.SYSTEM_URI || 'http://127.0.0.1:8013'
  },

  chargeModule: {
    host: process.env.CHARGE_MODULE_ORIGIN,
    cognito: {
      host: process.env.COGNITO_HOST,
      username: process.env.COGNITO_USERNAME,
      password: process.env.COGNITO_PASSWORD
    },
    customerFileRefreshFrequencyInMS: 3600000
  },

  proxy: process.env.PROXY,

  companiesHouse: {
    apiKey: process.env.COMPANIES_HOUSE_API_KEY
  },

  eaAddressFacade: {
    uri: process.env.EA_ADDRESS_FACADE_URI || 'http://localhost:9002'
  },

  redis: {
    maxListenerCount: 84,
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      ...(isTlsConnection) && { tls: {} },
      db: process.env.NODE_ENV === 'test' ? 4 : 2,
      lazyConnect: isRedisLazy,
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    }
  },

  featureToggles: {
    deleteAllBillingData: process.env.ENABLE_DELETE_ALL_BILLING_DATA_FEATURE === 'true' && !isProduction
  },

  slackHook: process.env.SLACK_HOOK
}
