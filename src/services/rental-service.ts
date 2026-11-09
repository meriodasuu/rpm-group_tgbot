export type RentalStatus = 'draft' | 'booked' | 'active' | 'completed' | 'cancelled';
export type DepositStatus = 'not_paid' | 'held' | 'due' | 'partially_returned' | 'returned' | 'retained';
export type Rental = { id: number; clientId: number; vehicleId: number; status: RentalStatus; startsAt: Date; expectedReturnAt: Date; actualIssuedAt?: Date; returnedAt?: Date; depositAmount: string };
export type Deposit = { id: number; rentalId: number; amount: string; returnAmount: string; dueAt: Date; status: DepositStatus; returnedAt?: Date };
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export class InMemoryRentalStore {
  rentals = new Map<number, Rental>();
  deposits = new Map<number, Deposit>();
  clients = new Map<number, { status: 'new' | 'active' }>();
  private rentalSequence = 1;
  private depositSequence = 1;
  createRental(input: Omit<Rental, 'id'>): Rental { const rental = { id: this.rentalSequence++, ...input }; this.rentals.set(rental.id, rental); if (!this.clients.has(rental.clientId)) this.clients.set(rental.clientId, { status: 'new' }); return rental; }
  createDeposit(input: Omit<Deposit, 'id'>): Deposit { const deposit = { id: this.depositSequence++, ...input }; this.deposits.set(deposit.id, deposit); return deposit; }
}

const isOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && aEnd > bStart;
const addCalendarDays = (value: Date, days: number) => { const result = new Date(value); result.setUTCDate(result.getUTCDate() + days); return result; };

export class RentalService {
  constructor(private readonly store: InMemoryRentalStore) {}
  create(input: { clientId: number; vehicleId: number; securityStatus: string; start: Date; end: Date; depositAmount: string }): Result<Rental> {
    if (input.securityStatus !== 'approved') return { ok: false, error: 'Аренда возможна только после одобрения СБ' };
    if (input.end <= input.start) return { ok: false, error: 'Время возврата должно быть позже выдачи' };
    if ([...this.store.rentals.values()].some((r) => r.vehicleId === input.vehicleId && ['booked', 'active'].includes(r.status) && isOverlap(input.start, input.end, r.startsAt, r.expectedReturnAt))) return { ok: false, error: 'Автомобиль занят на выбранный период' };
    return { ok: true, value: this.store.createRental({ clientId: input.clientId, vehicleId: input.vehicleId, status: 'booked', startsAt: input.start, expectedReturnAt: input.end, depositAmount: input.depositAmount }) };
  }
  issue(id: number, issuedAt: Date): Result<Rental> { const r = this.store.rentals.get(id); if (!r || r.status !== 'booked') return { ok: false, error: 'Выдать можно только забронированную аренду' }; r.status = 'active'; r.actualIssuedAt = issuedAt; return { ok: true, value: r }; }
  extend(id: number, end: Date): Result<Rental> { const r = this.store.rentals.get(id); if (!r || !['booked', 'active'].includes(r.status)) return { ok: false, error: 'Продлить можно только активную или забронированную аренду' }; if (end <= r.expectedReturnAt) return { ok: false, error: 'Новое время должно быть позже текущего' }; if ([...this.store.rentals.values()].some((x) => x.id !== id && x.vehicleId === r.vehicleId && ['booked', 'active'].includes(x.status) && isOverlap(r.startsAt, end, x.startsAt, x.expectedReturnAt))) return { ok: false, error: 'Продление пересекается с другой арендой' }; r.expectedReturnAt = end; return { ok: true, value: r }; }
  complete(input: { rentalId: number; returnedAt: Date; damaged: boolean; comment: string; rating: number }): Result<Rental> { const r = this.store.rentals.get(input.rentalId); if (!r || r.status !== 'active') return { ok: false, error: 'Завершить можно только активную аренду' }; if (input.damaged && !input.comment.trim()) return { ok: false, error: 'При повреждениях обязателен комментарий' }; if (!Number.isInteger(input.rating) || input.rating < 0 || input.rating > 5) return { ok: false, error: 'Оценка должна быть целым числом от 0 до 5' }; r.status = 'completed'; r.returnedAt = input.returnedAt; this.store.clients.get(r.clientId)!.status = 'active'; this.store.createDeposit({ rentalId: r.id, amount: r.depositAmount, returnAmount: r.depositAmount, dueAt: addCalendarDays(input.returnedAt, 14), status: 'due' }); return { ok: true, value: r }; }
  returnDeposit(id: number, amount: string): Result<Deposit> { const d = this.store.deposits.get(id); if (!d) return { ok: false, error: 'Залог не найден' }; if (d.status === 'returned') return { ok: false, error: 'Залог уже возвращён' }; d.returnAmount = amount; d.status = 'returned'; d.returnedAt = new Date(); return { ok: true, value: d }; }
}
