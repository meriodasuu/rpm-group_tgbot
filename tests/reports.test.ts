import { describe, expect, it } from 'vitest';
import { buildSummary, split } from '../src/reports.js';

describe('reporting', () => {
  it('renders a manager-readable dashboard and keeps empty sections explicit', () => {
    const messages = buildSummary({ active: [], issued: [], returned: [], deposits: [] }, new Date('2026-10-29T07:00:00Z'), 'Europe/Moscow');
    expect(messages.join('\n')).toContain('Активные аренды');
    expect(messages.join('\n')).toContain('Выдачи сегодня');
    expect(messages.join('\n')).toContain('Возвраты сегодня');
    expect(messages.join('\n')).toContain('Залоги к возврату');
    expect(messages.join('\n').match(/нет/g)).toHaveLength(4);
  });
  it('splits a long report without losing any characters', () => {
    const value = Array(20).fill('строка').join('\n');
    expect(split(value, 20).join('\n')).toBe(value);
  });
  it('keeps a short report in one Telegram message', () => {
    expect(split('первая строка\nпоследняя строка')).toEqual(['первая строка\nпоследняя строка']);
  });
});
