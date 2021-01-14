// return requirements data
exports.rq1 = {
    version: {
        versionNumber: 101,
        startDate: '2008-04-01',
        endDate: null,
        status: 'current',
        externalId: '1:12345678'
    },
    requirement: {
        returnsFrequency: 'month',
        isSummer: true,
        isUpload: false,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10,
        siteDescription: 'WELL POINTS AT MARS',
        description: '2 Jigga Watts 2000 CMD',
        legacyId: 12345678,
        externalId: '1:12345678'
    },
    purpose: {
        purposePrimaryId: 'A',
        purposeSecondaryId: 'AGR',
        purposeUseId: '400',
        purposeAlias: 'SPRAY IRRIGATION DIRECT',
        externalId: '1:12345678:A:AGR:400'
    }
};

exports.rq2 = {
    version: {
        versionNumber: 101,
        startDate: '2008-04-01',
        endDate:  null,
        status: 'current',
        externalId: '1:12345679'
    },
    requirement: {
        returnsFrequency: 'month',
        isSummer: false,
        isUpload: false,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 12,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 3,
        siteDescription: 'WELL POINTS AT MARS',
        description: '2 Jigga Watts 2000 CMD',
        legacyId: 12345678,
        externalId: '1:12345679'
    },
    purpose: {
        purposePrimaryId: 'A',
        purposeSecondaryId: 'AGR',
        purposeUseId: '420',
        purposeAlias: 'SPRAY IRRIGATION STORAGE',
        externalId: '1:12345679:A:AGR:420'
    }
};

