export function split(text: string, limit = 4000): string[] { if(text.length<=limit) return [text]; const result:string[]=[]; while(text.length>limit){ let p=text.lastIndexOf('\n',limit); if(p<1)p=limit; result.push(text.slice(0,p)); text=text.slice(p).replace(/^\n/,''); } if(text) result.push(text); return result; }

export type SummaryRows = { active: any[]; issued: any[]; returned: any[]; deposits: any[] };
const money = (value: unknown) => `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(value ?? 0))} ₽`;
const time = (value: string | Date, timezone: string) => new Intl.DateTimeFormat('ru-RU',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
const date = (value: string | Date, timezone: string) => new Intl.DateTimeFormat('ru-RU',{timeZone:timezone,day:'2-digit',month:'2-digit'}).format(new Date(value));
const total = (rows: any[], field: string) => rows.reduce((sum,row)=>sum+Number(row[field] ?? 0),0);
function rentalRows(rows: any[], timezone: string, moment: 'expected_return_at'|'starts_at') { return rows.length ? rows.map(row=>`• ${time(row[moment],timezone)} · ${row.title} — ${row.name}\n  #${row.id} · ${money(row.amount)}`).join('\n') : '— нет'; }
function depositRows(rows: any[], timezone: string) { return rows.length ? rows.map(row=>`• до ${date(row.due_at,timezone)} · ${row.name}\n  #${row.id} · ${money(row.return_amount ?? row.amount)}`).join('\n') : '— нет'; }
export function buildSummary(rows: SummaryRows, generatedAt: Date, timezone: string): string[] {
 const stamp = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short', timeZone: timezone }).format(generatedAt);
 const active = rows.active.length ? rows.active.map(row=>`• до ${time(row.expected_return_at,timezone)} · ${row.title} — ${row.name}\n  #${row.id} · ${money(row.amount)}`).join('\n') : '— нет';
 const text = [
  `📊 RPM RENT · СВОДКА`,
  `🗓️ ${stamp} · ${timezone}`,
  '━━━━━━━━━━━━━━━━━━',
  `🚗 Активные аренды · ${rows.active.length} · ${money(total(rows.active,'amount'))}\n${active}`,
  `🟢 Выдачи сегодня · ${rows.issued.length}\n${rentalRows(rows.issued,timezone,'starts_at')}`,
  `↩️ Возвраты сегодня · ${rows.returned.length}\n${rentalRows(rows.returned,timezone,'expected_return_at')}`,
  `💰 Залоги к возврату · ${rows.deposits.length} · ${money(rows.deposits.reduce((sum,row)=>sum+Number(row.return_amount ?? row.amount ?? 0),0))}\n${depositRows(rows.deposits,timezone)}`
 ].join('\n\n');
 return split(text);
}
export function buildClubDailyReport(row:{attempts:string|number; amount:string|number}, generatedAt:Date, timezone:string) { const stamp=new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:timezone}).format(generatedAt); return `Отчёт по RPM Club\n${stamp}\n\nПопыток начислено: ${row.attempts}\nДенег начислено: ${money(row.amount)}`; }
