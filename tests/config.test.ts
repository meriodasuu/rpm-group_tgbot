import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('disables summaries until a chat is configured', () => {
    const config = loadConfig({
      TELEGRAM_BOT_TOKEN: '123:token',
      BOT_DATABASE_URL: 'postgresql://bot:secret@db:5432/bot',
      TIMEZONE: 'Europe/Moscow',
      ADMIN_TELEGRAM_IDS: '1,2',
      OWNER_TELEGRAM_ID: '1'
    });

    expect(config.summaryChatId).toBeUndefined();
    expect(config.adminTelegramIds).toEqual(new Set([1, 2]));
  });

  it('rejects an invalid time zone so scheduled reports cannot run ambiguously', () => {
    expect(() => loadConfig({
      TELEGRAM_BOT_TOKEN: '123:token',
      BOT_DATABASE_URL: 'postgresql://bot:secret@db:5432/bot',
      TIMEZONE: 'not-a-zone',
      ADMIN_TELEGRAM_IDS: '1',
      OWNER_TELEGRAM_ID: '1'
    })).toThrow(/TIMEZONE/);
  });

  it('treats an empty optional RPM Club URL as absent', () => {
    expect(loadConfig({
      TELEGRAM_BOT_TOKEN: '123:token',
      BOT_DATABASE_URL: 'postgresql://bot:secret@db:5432/bot',
      RPM_CLUB_DATABASE_URL: '',
      TIMEZONE: 'Europe/Moscow',
      ADMIN_TELEGRAM_IDS: '1',
      OWNER_TELEGRAM_ID: '1'
    }).rpmClubDatabaseUrl).toBeUndefined();
  });
});
