import type pg from 'pg';

export async function ensureRentalFeatures(db: pg.Pool) {
  await db.query(`CREATE TABLE IF NOT EXISTS client_blacklist (client_id bigint PRIMARY KEY REFERENCES clients(id), added_by_telegram_id bigint NOT NULL, reason text, created_at timestamptz NOT NULL DEFAULT now())`);
  await db.query(`CREATE TABLE IF NOT EXISTS client_attempts (id bigserial PRIMARY KEY, client_id bigint NOT NULL REFERENCES clients(id), attempt_date date NOT NULL DEFAULT current_date, added_by_telegram_id bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(client_id,attempt_date))`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_club_rental_amounts (id bigserial PRIMARY KEY, club_user_id uuid NOT NULL, client_name text NOT NULL, amount numeric(14,2) NOT NULL CHECK(amount>0), added_by_telegram_id bigint NOT NULL, external_rental_id text, car_name text, start_date date, end_date date, club_rental_id uuid, cashback_bonus bigint, created_at timestamptz NOT NULL DEFAULT now())`);
  await db.query(`ALTER TABLE rpm_club_rental_amounts ADD COLUMN IF NOT EXISTS external_rental_id text, ADD COLUMN IF NOT EXISTS car_name text, ADD COLUMN IF NOT EXISTS start_date date, ADD COLUMN IF NOT EXISTS end_date date, ADD COLUMN IF NOT EXISTS club_rental_id uuid, ADD COLUMN IF NOT EXISTS cashback_bonus bigint`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS rpm_club_rental_amounts_external_id_uq ON rpm_club_rental_amounts(external_rental_id) WHERE external_rental_id IS NOT NULL`);
  await db.query(`CREATE TABLE IF NOT EXISTS rpm_club_attempt_grants (id bigserial PRIMARY KEY, club_user_id uuid NOT NULL, added_by_telegram_id bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);
  await db.query(`ALTER TABLE rentals ADD COLUMN IF NOT EXISTS issued_by_telegram_id bigint`);
  await db.query(`ALTER TABLE rentals ADD COLUMN IF NOT EXISTS returned_by_telegram_id bigint`);
  await db.query(`ALTER TABLE return_inspections ADD COLUMN IF NOT EXISTS photo_file_id text`);
}
