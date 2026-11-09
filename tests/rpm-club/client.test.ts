import { describe, expect, it } from 'vitest';
import { RpmClubClient } from '../../src/rpm-club/client.js';

describe('RpmClubClient', () => {
  it('returns an unavailable result instead of blocking local work when the source fails', async () => {
    const client = new RpmClubClient({ query: async () => { throw new Error('connection refused'); } } as any);
    await expect(client.search('Ivan')).resolves.toEqual({ status: 'unavailable', members: [] });
  });

  it('uses a parameterized query against the approved view', async () => {
    const calls: unknown[][] = [];
    const client = new RpmClubClient({ query: async (...args: unknown[]) => { calls.push(args); return { rows: [] }; } } as any);
    await client.search("x' OR 1=1 --");
    expect(String(calls[0][0])).toContain('integration.v_members');
    expect(String(calls[0][0])).not.toContain("x' OR");
    expect(calls[0][1]).toEqual(["%x' OR 1=1 --%"]);
  });
});
