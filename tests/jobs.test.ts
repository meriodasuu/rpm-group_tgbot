import { describe, expect, it } from 'vitest';
import { summaryJobKey, shouldScheduleSummary } from '../src/jobs.js';

describe('summary scheduling', () => {
  it('creates one idempotency key per scheduled local minute', () => {
    const at = new Date('2026-10-29T19:00:00Z');
    expect(shouldScheduleSummary(at, 'Europe/Moscow')).toBe(true);
    expect(summaryJobKey(new Date('2026-10-29T19:00:00Z'), 'Europe/Moscow')).toBe('summary:2026-10-29:22:00');
  });
  it('schedules only 22:00 Moscow time', () => { expect(shouldScheduleSummary(new Date('2026-10-29T19:00:00Z'), 'Europe/Moscow')).toBe(true); expect(shouldScheduleSummary(new Date('2026-10-29T07:00:00Z'), 'Europe/Moscow')).toBe(false); });
});
