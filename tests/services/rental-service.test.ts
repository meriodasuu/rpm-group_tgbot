import { describe, expect, it } from 'vitest';
import { InMemoryRentalStore, RentalService } from '../../src/services/rental-service.js';

const at = (value: string) => new Date(value);

describe('RentalService', () => {
  it('creates an approved booking and rejects overlapping active periods', () => {
    const store = new InMemoryRentalStore();
    const service = new RentalService(store);
    const first = service.create({ clientId: 1, vehicleId: 7, securityStatus: 'approved', start: at('2026-10-30T10:00:00Z'), end: at('2026-10-31T10:00:00Z'), depositAmount: '5000' });
    expect(first.ok).toBe(true);
    const overlap = service.create({ clientId: 2, vehicleId: 7, securityStatus: 'approved', start: at('2026-10-31T09:59:00Z'), end: at('2026-11-01T10:00:00Z'), depositAmount: '5000' });
    expect(overlap).toMatchObject({ ok: false, error: expect.stringMatching(/занят/) });
  });

  it('completes the first rental, creates a +14 calendar-day deposit task and blocks a double return', () => {
    const store = new InMemoryRentalStore();
    const service = new RentalService(store);
    const booking = service.create({ clientId: 1, vehicleId: 7, securityStatus: 'approved', start: at('2026-10-30T10:00:00Z'), end: at('2026-10-31T10:00:00Z'), depositAmount: '5000' });
    if (!booking.ok) throw new Error(booking.error);
    expect(service.issue(booking.value.id, at('2026-10-30T10:05:00Z'))).toMatchObject({ ok: true });
    const completed = service.complete({ rentalId: booking.value.id, returnedAt: at('2026-10-31T12:00:00Z'), damaged: false, comment: '', rating: 5 });
    expect(completed).toMatchObject({ ok: true });
    expect(store.clients.get(1)?.status).toBe('active');
    const deposit = [...store.deposits.values()][0];
    expect(deposit.dueAt.toISOString()).toBe('2026-11-14T12:00:00.000Z');
    expect(service.returnDeposit(deposit.id, '5000')).toMatchObject({ ok: true });
    expect(service.returnDeposit(deposit.id, '5000')).toMatchObject({ ok: false, error: expect.stringMatching(/уже/) });
  });

  it('keeps the original expected return when an extension conflicts', () => {
    const store = new InMemoryRentalStore();
    const service = new RentalService(store);
    const a = service.create({ clientId: 1, vehicleId: 7, securityStatus: 'approved', start: at('2026-10-30T10:00:00Z'), end: at('2026-10-31T10:00:00Z'), depositAmount: '5000' });
    const b = service.create({ clientId: 2, vehicleId: 7, securityStatus: 'approved', start: at('2026-11-01T10:00:00Z'), end: at('2026-11-02T10:00:00Z'), depositAmount: '5000' });
    if (!a.ok || !b.ok) throw new Error('setup failed');
    expect(service.extend(a.value.id, at('2026-11-01T12:00:00Z'))).toMatchObject({ ok: false });
    expect(store.rentals.get(a.value.id)?.expectedReturnAt.toISOString()).toBe('2026-10-31T10:00:00.000Z');
  });
});
