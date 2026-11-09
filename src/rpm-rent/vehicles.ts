import type pg from 'pg';

export type RentalVehicle = { code: string; title: string; identifier: string; available: boolean };
export const mapRentalVehicle = (row: { id: string; title: string; slug: string; available: boolean }): RentalVehicle => ({ code: row.id, title: row.title, identifier: row.slug, available: row.available });
export async function syncRentalVehicles(source: pg.Pool, target: pg.Pool) {
 const rows=(await source.query<{id:string;title:string;slug:string;available:boolean}>('SELECT id,title,slug,available FROM integration.v_rental_vehicles WHERE available=true ORDER BY title')).rows.map(mapRentalVehicle);
 for (const vehicle of rows) await target.query(`INSERT INTO vehicles(code,title,identifier,available) VALUES($1,$2,$3,$4) ON CONFLICT(code) DO UPDATE SET title=EXCLUDED.title,identifier=EXCLUDED.identifier,available=EXCLUDED.available`,[vehicle.code,vehicle.title,vehicle.identifier,vehicle.available]);
 return rows.length;
}
