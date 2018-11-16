const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const moment = require('moment');
moment.locale('en-gb');

const naldDates = require('../../src/lib/nald-dates');

experiment('is the main locale', async () => {
  test('in the context of the outer test suite the last day of the week is a sunday', async () => {
    const sunday = moment('2018-10-28', 'YYYY-MM-DD').endOf('day');
    const monday = moment('2018-10-22', 'YYYY-MM-DD');
    expect(monday.endOf('week').toString()).to.equal(sunday.toString());
  });

  test('in the context of the outer test suite the first day of the week is a monday', async () => {
    const sunday = moment('2018-10-28', 'YYYY-MM-DD');
    const monday = moment('2018-10-22', 'YYYY-MM-DD');
    expect(sunday.startOf('week').toString()).to.equal(monday.toString());
  });
});

experiment('getWeek using moments', () => {
  test('for a sunday the first day of the week is that sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD');
    const week = naldDates.getWeek(sunday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a sunday the last day of the week is the next saturday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD');
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(sunday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a monday the first day of the week is the previous sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const monday = moment('2018-10-22', 'YYYY-MM-DD');
    const week = naldDates.getWeek(monday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a monday the last day of the week is the next saturday', async () => {
    const monday = moment('2018-10-22', 'YYYY-MM-DD');
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(monday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a tuesday the first day of the week is the previous sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const tuesday = moment('2018-10-23', 'YYYY-MM-DD');
    const week = naldDates.getWeek(tuesday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a tuesday the last day of the week is the next saturday', async () => {
    const tuesday = moment('2018-10-23', 'YYYY-MM-DD');
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(tuesday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a wednesday the first day of the week is the previous sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const wednesday = moment('2018-10-24', 'YYYY-MM-DD');
    const week = naldDates.getWeek(wednesday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a wednesday the last day of the week is the next saturday', async () => {
    const wednesday = moment('2018-10-24', 'YYYY-MM-DD');
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(wednesday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a thursday the first day of the week is the previous sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const thursday = moment('2018-10-25', 'YYYY-MM-DD');
    const week = naldDates.getWeek(thursday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a thursday the last day of the week is the next saturday', async () => {
    const thursday = moment('2018-10-25', 'YYYY-MM-DD');
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(thursday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a friday the first day of the week is the previous sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const friday = moment('2018-10-26', 'YYYY-MM-DD');
    const week = naldDates.getWeek(friday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a friday the last day of the week is the next saturday', async () => {
    const friday = moment('2018-10-26', 'YYYY-MM-DD');
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(friday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a saturday the first day of the week is the previous sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const saturday = moment('2018-10-27', 'YYYY-MM-DD');
    const week = naldDates.getWeek(saturday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a saturday the last day of the week is that saturday', async () => {
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(saturday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });
});

experiment('getWeek using strings', () => {
  test('for a sunday the first day of the week is that sunday', async () => {
    const sunday = moment('2018-10-21', 'YYYY-MM-DD');
    const week = naldDates.getWeek('2018-10-21');
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a sunday the last day of the week is the next saturday', async () => {
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek('2018-10-21');
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a monday the first day of the week is the previous sunday', async () => {
    const monday = '2018-10-22';
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const week = naldDates.getWeek(monday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a monday the last day of the week is the next saturday', async () => {
    const monday = '2018-10-22';
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(monday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a tuesday the first day of the week is the previous sunday', async () => {
    const tuesday = '2018-10-23';
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const week = naldDates.getWeek(tuesday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a tuesday the last day of the week is the next saturday', async () => {
    const tuesday = '2018-10-23';
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(tuesday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a wednesday the first day of the week is the previous sunday', async () => {
    const wednesday = '2018-10-24';
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const week = naldDates.getWeek(wednesday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a wednesday the last day of the week is the next saturday', async () => {
    const wednesday = '2018-10-24';
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(wednesday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a thursday the first day of the week is the previous sunday', async () => {
    const thursday = '2018-10-25';
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const week = naldDates.getWeek(thursday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a thursday the last day of the week is the next saturday', async () => {
    const thursday = '2018-10-25';
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(thursday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a friday the first day of the week is the previous sunday', async () => {
    const friday = '2018-10-26';
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const week = naldDates.getWeek(friday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a friday the last day of the week is the next saturday', async () => {
    const friday = '2018-10-26';
    const saturday = moment('2018-10-27', 'YYYY-MM-DD').endOf('day');
    const week = naldDates.getWeek(friday);
    expect(week.end.toString()).to.equal(saturday.toString());
  });

  test('for a saturday the first day of the week is the previous sunday', async () => {
    const saturday = '2018-10-27';
    const sunday = moment('2018-10-21', 'YYYY-MM-DD').startOf('day');
    const week = naldDates.getWeek(saturday);
    expect(week.start.toString()).to.equal(sunday.toString());
  });

  test('for a saturday the last day of the week is that saturday', async () => {
    const saturday = '2018-10-27';
    const week = naldDates.getWeek(saturday);
    expect(week.end.toString()).to.equal(moment(saturday).endOf('day').toString());
  });
});
