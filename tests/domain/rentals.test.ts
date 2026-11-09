import { describe, expect, it } from 'vitest';
import { hasConflict, validateCompletion, validatePeriod } from '../../src/domain/rentals.js';

describe('rental rules', () => {
  it('rejects a return before issuance', () => expect(validatePeriod(new Date('2026-01-02'), new Date('2026-01-01'))).toMatch(/позже/));
  it('allows back-to-back rentals but rejects an overlap', () => {
    const booked = [{ start: new Date('2026-01-01T10:00Z'), end: new Date('2026-01-02T10:00Z'), status: 'booked' }];
    expect(hasConflict(booked, new Date('2026-01-02T10:00Z'), new Date('2026-01-03T10:00Z'))).toBe(false);
    expect(hasConflict(booked, new Date('2026-01-01T12:00Z'), new Date('2026-01-03T10:00Z'))).toBe(true);
  });
  it('requires damage comment on completion', () => expect(validateCompletion(true, '')).toMatch(/комментарий/));
});
