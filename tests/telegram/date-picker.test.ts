import { describe, expect, it } from 'vitest';
import { addDays } from '../../src/date-picker.js';

describe('date picker', () => {
  it('moves the calendar forward beyond the first week', () => {
    expect(addDays('2026-11-04', 7)).toBe('2026-11-11');
  });
});
