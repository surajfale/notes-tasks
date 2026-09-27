const { DateTime } = require('luxon');
const { nextOccurrence, computeNextFireAt, mergeReminders } = require('./reminders');

const iso = (s) => new Date(s);
const local = (date, zone) => DateTime.fromJSDate(date, { zone }).toFormat("yyyy-MM-dd'T'HH:mm ccc");

function reminder(startAt, repeat = { frequency: 'none' }, timezone = 'UTC') {
  return { startAt: iso(startAt), timezone, repeat };
}

describe('nextOccurrence', () => {
  describe('none (one-off)', () => {
    const r = reminder('2026-10-01T15:00:00Z');

    it('returns startAt when it is still ahead', () => {
      expect(nextOccurrence(r, iso('2026-10-01T14:00:00Z'))).toEqual(iso('2026-10-01T15:00:00Z'));
    });

    it('includes an occurrence exactly at `after`', () => {
      expect(nextOccurrence(r, iso('2026-10-01T15:00:00Z'))).toEqual(iso('2026-10-01T15:00:00Z'));
    });

    it('returns null once it has passed', () => {
      expect(nextOccurrence(r, iso('2026-10-01T15:00:01Z'))).toBeNull();
    });
  });

  describe('hourly (every N hours, absolute)', () => {
    const r = reminder('2026-10-01T09:00:00Z', { frequency: 'hourly', interval: 2 });

    it('returns startAt before the series begins', () => {
      expect(nextOccurrence(r, iso('2026-09-30T00:00:00Z'))).toEqual(iso('2026-10-01T09:00:00Z'));
    });

    it('steps by N hours', () => {
      expect(nextOccurrence(r, iso('2026-10-01T09:00:01Z'))).toEqual(iso('2026-10-01T11:00:00Z'));
      expect(nextOccurrence(r, iso('2026-10-01T11:30:00Z'))).toEqual(iso('2026-10-01T13:00:00Z'));
    });

    it('jumps far ahead without iterating', () => {
      expect(nextOccurrence(r, iso('2027-10-01T10:00:00Z'))).toEqual(iso('2027-10-01T11:00:00Z'));
    });
  });

  describe('daily (every N days, wall clock)', () => {
    it('repeats every N days', () => {
      const r = reminder('2026-10-01T09:00:00Z', { frequency: 'daily', interval: 3 });
      expect(nextOccurrence(r, iso('2026-10-01T09:00:01Z'))).toEqual(iso('2026-10-04T09:00:00Z'));
      expect(nextOccurrence(r, iso('2026-10-05T00:00:00Z'))).toEqual(iso('2026-10-07T09:00:00Z'));
    });

    it('keeps local time across a DST change (New York, Nov 1 2026)', () => {
      // 09:00 EDT (UTC-4) = 13:00Z. After the Nov 1 fall-back it must stay
      // 09:00 local, which is 14:00Z (EST, UTC-5).
      const r = reminder('2026-10-30T13:00:00Z', { frequency: 'daily', interval: 1 }, 'America/New_York');
      const next = nextOccurrence(r, iso('2026-11-02T00:00:00Z'));
      expect(next).toEqual(iso('2026-11-02T14:00:00Z'));
      expect(local(next, 'America/New_York')).toBe('2026-11-02T09:00 Mon');
    });
  });

  describe('weekly', () => {
    // 2026-10-05 is a Monday.
    const mondayNine = '2026-10-05T09:00:00Z';

    it('defaults to the weekday of startAt', () => {
      const r = reminder(mondayNine, { frequency: 'weekly', interval: 1, weekdays: [] });
      expect(nextOccurrence(r, iso('2026-10-05T09:00:01Z'))).toEqual(iso('2026-10-12T09:00:00Z'));
    });

    it('walks the chosen weekdays in order', () => {
      const r = reminder(mondayNine, { frequency: 'weekly', interval: 1, weekdays: [1, 3, 5] });
      expect(nextOccurrence(r, iso('2026-10-05T10:00:00Z'))).toEqual(iso('2026-10-07T09:00:00Z')); // Wed
      expect(nextOccurrence(r, iso('2026-10-07T10:00:00Z'))).toEqual(iso('2026-10-09T09:00:00Z')); // Fri
      expect(nextOccurrence(r, iso('2026-10-09T10:00:00Z'))).toEqual(iso('2026-10-12T09:00:00Z')); // next Mon
    });

    it('never fires before startAt even if an earlier weekday is selected', () => {
      // Starts Wednesday; Monday is selected too, but that Monday is before startAt.
      const r = reminder('2026-10-07T09:00:00Z', { frequency: 'weekly', interval: 1, weekdays: [1, 3] });
      expect(nextOccurrence(r, iso('2026-10-01T00:00:00Z'))).toEqual(iso('2026-10-07T09:00:00Z'));
      expect(nextOccurrence(r, iso('2026-10-07T09:00:01Z'))).toEqual(iso('2026-10-12T09:00:00Z'));
    });

    it('skips weeks for every-N-weeks', () => {
      const r = reminder(mondayNine, { frequency: 'weekly', interval: 2, weekdays: [1] });
      expect(nextOccurrence(r, iso('2026-10-05T09:00:01Z'))).toEqual(iso('2026-10-19T09:00:00Z'));
      expect(nextOccurrence(r, iso('2026-10-20T00:00:00Z'))).toEqual(iso('2026-11-02T09:00:00Z'));
    });

    it('evaluates weekdays in the reminder timezone, not UTC', () => {
      // Monday 08:00 in Tokyo is Sunday 23:00Z.
      const r = reminder('2026-10-04T23:00:00Z', { frequency: 'weekly', interval: 1, weekdays: [1] }, 'Asia/Tokyo');
      const next = nextOccurrence(r, iso('2026-10-05T00:00:00Z'));
      expect(local(next, 'Asia/Tokyo')).toBe('2026-10-12T08:00 Mon');
    });
  });

  describe('monthly', () => {
    it('repeats every N months on the same day', () => {
      const r = reminder('2026-01-15T09:00:00Z', { frequency: 'monthly', interval: 2 });
      expect(nextOccurrence(r, iso('2026-01-15T09:00:01Z'))).toEqual(iso('2026-03-15T09:00:00Z'));
    });

    it("clamps the 31st to each month's last day without drifting", () => {
      const r = reminder('2026-01-31T09:00:00Z', { frequency: 'monthly', interval: 1 });
      expect(nextOccurrence(r, iso('2026-02-01T00:00:00Z'))).toEqual(iso('2026-02-28T09:00:00Z'));
      // After February it goes back to the 31st, not the 28th.
      expect(nextOccurrence(r, iso('2026-03-01T00:00:00Z'))).toEqual(iso('2026-03-31T09:00:00Z'));
    });
  });

  it('falls back to UTC for an invalid timezone instead of throwing', () => {
    const r = reminder('2026-10-01T09:00:00Z', { frequency: 'daily', interval: 1 }, 'Not/AZone');
    expect(nextOccurrence(r, iso('2026-10-01T10:00:00Z'))).toEqual(iso('2026-10-02T09:00:00Z'));
  });
});

describe('computeNextFireAt', () => {
  it('never returns the occurrence that already fired', () => {
    const r = {
      ...reminder('2026-10-01T09:00:00Z', { frequency: 'daily', interval: 1 }),
      lastFiredAt: iso('2026-10-01T09:00:00Z'),
    };
    // "now" is before the fired occurrence (e.g. clock skew): still must not repeat it.
    expect(computeNextFireAt(r, iso('2026-10-01T08:59:00Z'))).toEqual(iso('2026-10-02T09:00:00Z'));
  });

  it('is null for a one-off that already fired', () => {
    const r = { ...reminder('2026-10-01T09:00:00Z'), lastFiredAt: iso('2026-10-01T09:00:00Z') };
    expect(computeNextFireAt(r, iso('2026-10-01T08:00:00Z'))).toBeNull();
  });
});

describe('mergeReminders', () => {
  const existing = [{
    _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    lastFiredAt: iso('2026-10-01T09:00:00Z'),
  }];

  it('keeps id and lastFiredAt for an existing reminder, ignoring client-sent server fields', () => {
    const [merged] = mergeReminders(existing, [{
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      startAt: '2026-10-01T09:00:30.500Z',
      timezone: 'UTC',
      repeat: { frequency: 'daily', interval: 1 },
      channels: { email: true, push: false },
      nextFireAt: '1999-01-01T00:00:00Z',
      lastFiredAt: '1999-01-01T00:00:00Z',
    }]);

    expect(merged._id).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(merged.lastFiredAt).toEqual(iso('2026-10-01T09:00:00Z'));
    expect(merged.nextFireAt).toBeUndefined();
    expect(merged.startAt).toEqual(iso('2026-10-01T09:00:00Z')); // seconds dropped
  });

  it('treats an unknown _id as a new reminder', () => {
    const [merged] = mergeReminders(existing, [{
      _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      startAt: '2026-10-01T09:00:00Z',
      timezone: 'UTC',
      repeat: { frequency: 'none' },
      channels: { email: true },
    }]);
    expect(merged._id).toBeUndefined();
    expect(merged.lastFiredAt).toBeUndefined();
  });

  it('normalizes repeat fields per frequency', () => {
    const [once, weekly] = mergeReminders([], [
      { startAt: '2026-10-05T09:00:00Z', timezone: 'UTC', repeat: { frequency: 'none', interval: 5, weekdays: [2] }, channels: { push: true } },
      { startAt: '2026-10-05T09:00:00Z', timezone: 'UTC', repeat: { frequency: 'weekly', interval: 1, weekdays: [5, 1, 5] }, channels: { email: true } },
    ]);
    expect(once.repeat).toEqual({ frequency: 'none', interval: 1, weekdays: [] });
    expect(once.channels).toEqual({ email: false, push: true });
    expect(weekly.repeat.weekdays).toEqual([1, 5]);
  });

  it('defaults weekly weekdays to the start day', () => {
    const [weekly] = mergeReminders([], [
      { startAt: '2026-10-07T09:00:00Z', timezone: 'UTC', repeat: { frequency: 'weekly', interval: 1, weekdays: [] }, channels: { email: true } },
    ]);
    expect(weekly.repeat.weekdays).toEqual([3]); // Wednesday
  });
});
