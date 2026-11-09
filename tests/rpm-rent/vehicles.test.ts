import { describe, expect, it } from 'vitest';
import { mapRentalVehicle } from '../../src/rpm-rent/vehicles.js';

describe('RPM Rent vehicle adapter', () => {
  it('maps only the manager-facing vehicle fields', () => {
    expect(mapRentalVehicle({ id: 'bmw-1', title: 'BMW 320', slug: 'bmw-320', available: true })).toEqual({ code: 'bmw-1', title: 'BMW 320', identifier: 'bmw-320', available: true });
  });
});
