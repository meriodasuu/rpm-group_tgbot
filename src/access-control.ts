import type pg from 'pg';

export async function ensureAccessControl(db: pg.Pool, ownerTelegramId: number) {
  await db.query(`CREATE TABLE IF NOT EXISTS bot_admins (telegram_id bigint PRIMARY KEY, role text NOT NULL CHECK (role IN ('owner','admin')), added_by bigint, added_at timestamptz NOT NULL DEFAULT now())`);
  await db.query(`CREATE TABLE IF NOT EXISTS admin_access_requests (telegram_id bigint PRIMARY KEY, username text, display_name text, requested_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
  await db.query(`INSERT INTO bot_admins(telegram_id,role) VALUES($1,'owner') ON CONFLICT(telegram_id) DO UPDATE SET role='owner'`,[ownerTelegramId]);
}

export async function isDatabaseAdmin(db: pg.Pool, telegramId: number) {
  return Boolean((await db.query('SELECT 1 FROM bot_admins WHERE telegram_id=$1',[telegramId])).rowCount);
}

export async function saveAccessRequest(db: pg.Pool, telegramId: number, username?: string, displayName?: string) {
  await db.query(`INSERT INTO admin_access_requests(telegram_id,username,display_name) VALUES($1,$2,$3) ON CONFLICT(telegram_id) DO UPDATE SET username=EXCLUDED.username,display_name=EXCLUDED.display_name,updated_at=now()`,[telegramId,username ?? null,displayName ?? null]);
}
