import { describe, expect, it } from 'vitest';
import { keepSearchOpen } from '../../src/search-state.js';

describe('client search state', () => {
  it('keeps search mode after an unsuccessful query so the next message is searched too', () => {
    expect(keepSearchOpen()).toEqual({ kind: 'search' });
  });
});
