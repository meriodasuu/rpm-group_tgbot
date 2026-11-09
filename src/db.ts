import pg from 'pg';
export const pool = (url: string) => new pg.Pool({ connectionString: url, connectionTimeoutMillis: 3000, query_timeout: 3000 });
export async function one<T extends pg.QueryResultRow>(db: pg.Pool, text: string, values: unknown[] = []): Promise<T | undefined> { return (await db.query<T>(text, values)).rows[0]; }
