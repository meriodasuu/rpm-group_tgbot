import { describe, expect, it } from 'vitest';
import { RpmClubWriter } from '../../src/rpm-club/writer.js';

describe('RpmClubWriter', () => {
  it('creates a new pending member with a parameterized query', async () => {
    const calls: unknown[][] = [];
    const writer = new RpmClubWriter({ query: async (...args: unknown[]) => { calls.push(args); return { rows: [{ id: 'a', name: 'Иван', status: 'pending' }] }; } } as any);
    await expect(writer.createClient('Иван')).resolves.toEqual({ userId: 'a', name: 'Иван', status: 'pending' });
    expect(String(calls[0][0])).toContain('INSERT INTO public.users');
    expect(calls[0][1]).toEqual(['Иван']);
  });
});
