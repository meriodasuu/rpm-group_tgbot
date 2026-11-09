import type pg from 'pg';
export async function summary(db: pg.Pool) {
 const [active, issued, returned, deposits] = await Promise.all([
  db.query(`SELECT r.id,v.title,c.name,r.expected_return_at,r.amount FROM rentals r JOIN clients c ON c.id=r.client_id JOIN vehicles v ON v.id=r.vehicle_id WHERE r.status='active' ORDER BY r.expected_return_at`),
  db.query(`SELECT r.id,v.title,c.name,r.starts_at,r.amount FROM rentals r JOIN clients c ON c.id=r.client_id JOIN vehicles v ON v.id=r.vehicle_id WHERE r.status='booked' AND (r.starts_at AT TIME ZONE 'Europe/Moscow')::date=(now() AT TIME ZONE 'Europe/Moscow')::date ORDER BY r.starts_at`),
  db.query(`SELECT r.id,v.title,c.name,r.expected_return_at,r.amount FROM rentals r JOIN clients c ON c.id=r.client_id JOIN vehicles v ON v.id=r.vehicle_id WHERE r.status IN ('booked','active') AND (r.expected_return_at AT TIME ZONE 'Europe/Moscow')::date=(now() AT TIME ZONE 'Europe/Moscow')::date ORDER BY r.expected_return_at`),
  db.query(`SELECT d.id,c.name,d.amount,d.return_amount,d.due_at,d.status FROM deposits d JOIN rentals r ON r.id=d.rental_id JOIN clients c ON c.id=r.client_id WHERE d.status IN ('due','held','not_paid') AND d.due_at <= now()+interval '14 days' ORDER BY d.due_at`)
 ]); return {active:active.rows, issued:issued.rows, returned:returned.rows, deposits:deposits.rows};
}

export async function findClient(db: pg.Pool, query: string) {
  return (await db.query(`SELECT id,name,phone,telegram_username,status,security_status,club_external_id,club_status,club_synced_at
    FROM clients WHERE name ILIKE $1 OR phone ILIKE $1 OR telegram_username ILIKE $1 OR CAST(telegram_user_id AS text)=$2
    ORDER BY id LIMIT 10`, [`%${query}%`, query])).rows;
}
export async function clubDailySummary(db:pg.Pool) { const [attempts,amount]=await Promise.all([db.query<{count:string}>(`SELECT count(*) FROM rpm_club_attempt_grants WHERE (created_at AT TIME ZONE 'Europe/Moscow')::date=(now() AT TIME ZONE 'Europe/Moscow')::date`),db.query<{amount:string}>(`SELECT coalesce(sum(amount),0)::text AS amount FROM rpm_club_rental_amounts WHERE external_rental_id IS NOT NULL AND (created_at AT TIME ZONE 'Europe/Moscow')::date=(now() AT TIME ZONE 'Europe/Moscow')::date`)]); return {attempts:attempts.rows[0].count,amount:amount.rows[0].amount}; }
