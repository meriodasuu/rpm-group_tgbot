type Queryable = { query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> };
export type CreatedRpmClient = { userId: string; name: string; status: string };
export class RpmClubWriter { constructor(private readonly db: Queryable) {} async createClient(name: string): Promise<CreatedRpmClient> { const row=(await this.db.query(`INSERT INTO public.users(name,status) VALUES($1,'pending') RETURNING id,name,status`,[name])).rows[0]; return { userId:String(row.id),name:String(row.name),status:String(row.status) }; } }
