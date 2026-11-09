import { describe, expect, it } from 'vitest';
import { menuLabels } from '../../src/telegram-menu.js';

describe('manager menu', () => {
  it('exposes the six daily work areas without requiring slash commands', () => {
    expect(menuLabels).toEqual(['➕ Новая аренда', '👥 Клиенты', '🚗 Аренды', '💰 Залоги', '📊 Сводка', '🎬 Стетхем']);
  });
});
