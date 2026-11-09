import type pg from 'pg';
import type { Bot } from 'grammy';
import { clubDailySummary } from './repository.js';
import { buildClubDailyReport } from './reports.js';

const local = (at: Date, timezone: string) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(at).filter(p => p.type !== 'literal').map(p => [p.type,p.value]));
export function shouldScheduleSummary(at: Date, timezone: string) { const value = local(at,timezone); return value.minute === '00' && value.hour === '22'; }
export function summaryJobKey(at: Date, timezone: string) { const value = local(at,timezone); return `summary:${value.year}-${value.month}-${value.day}:${value.hour}:${value.minute}`; }
export async function sendSummaryIfDue(db: pg.Pool, bot: Bot, chatId: string | undefined, timezone: string, at = new Date()) {
 if (!chatId || !shouldScheduleSummary(at,timezone)) return false;
 const inserted = await db.query(`INSERT INTO scheduled_jobs(kind,idempotency_key,scheduled_at,status) VALUES('summary',$1,$2,'pending') ON CONFLICT(idempotency_key) DO NOTHING RETURNING id`, [summaryJobKey(at,timezone),at]);
 if (!inserted.rowCount) return false;
 try { await bot.api.sendMessage(chatId,buildClubDailyReport(await clubDailySummary(db),at,timezone)); await db.query(`UPDATE scheduled_jobs SET status='sent',sent_at=now(),attempts=attempts+1 WHERE id=$1`,[inserted.rows[0].id]); return true; }
 catch (error) { await db.query(`UPDATE scheduled_jobs SET status='failed',attempts=attempts+1,last_error=$2 WHERE id=$1`,[inserted.rows[0].id,error instanceof Error ? error.message : 'Unknown error']); throw error; }
}
