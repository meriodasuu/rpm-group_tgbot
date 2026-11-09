import { z } from 'zod';

export type AppConfig = {
  telegramBotToken: string;
  botDatabaseUrl: string;
  rpmClubDatabaseUrl?: string;
  rpmClubApiDatabaseUrl?: string;
  rpmRentDatabaseUrl?: string;
  timezone: string;
  adminTelegramIds: Set<number>;
  ownerTelegramId: number;
  summaryChatId?: string;
};

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  BOT_DATABASE_URL: z.string().url(),
  RPM_CLUB_DATABASE_URL: z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional()),
  RPM_CLUB_API_DATABASE_URL: z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional()),
  RPM_RENT_DATABASE_URL: z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional()),
  TIMEZONE: z.string().min(1),
  ADMIN_TELEGRAM_IDS: z.string().min(1),
  OWNER_TELEGRAM_ID: z.coerce.number().int().positive(),
  SUMMARY_CHAT_ID: z.string().min(1).optional()
});

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const value = envSchema.parse(env);
  try {
    new Intl.DateTimeFormat('ru-RU', { timeZone: value.TIMEZONE });
  } catch {
    throw new Error('TIMEZONE must be a valid IANA time zone');
  }

  const adminTelegramIds = new Set(value.ADMIN_TELEGRAM_IDS.split(',').map((item) => Number(item.trim())));
  if ([...adminTelegramIds].some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error('ADMIN_TELEGRAM_IDS must contain positive numeric Telegram IDs');
  }

  return {
    telegramBotToken: value.TELEGRAM_BOT_TOKEN,
    botDatabaseUrl: value.BOT_DATABASE_URL,
    rpmClubDatabaseUrl: value.RPM_CLUB_DATABASE_URL,
    rpmClubApiDatabaseUrl: value.RPM_CLUB_API_DATABASE_URL,
    rpmRentDatabaseUrl: value.RPM_RENT_DATABASE_URL,
    timezone: value.TIMEZONE,
    adminTelegramIds,
    ownerTelegramId: value.OWNER_TELEGRAM_ID,
    summaryChatId: value.SUMMARY_CHAT_ID
  };
}
