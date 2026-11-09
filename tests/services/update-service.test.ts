import { describe, expect, it } from 'vitest';
import { InMemoryProcessedUpdates, UpdateService } from '../../src/services/update-service.js';

describe('UpdateService', () => {
  it('executes a Telegram update only once', async () => {
    const service = new UpdateService(new InMemoryProcessedUpdates());
    let calls = 0;
    await expect(service.process(42, async () => { calls += 1; })).resolves.toBe(true);
    await expect(service.process(42, async () => { calls += 1; })).resolves.toBe(false);
    expect(calls).toBe(1);
  });
});
