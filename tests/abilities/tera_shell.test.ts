import { describe, it, expect } from 'vitest';
import { getDamageMultiplier } from '../../services/engine/handlers/abilities/tera_shell';
import { createDummy } from '../factories';
import { LogEntry } from '../../types';

describe('Tera Shell', () => {
  it('deve resistir a ataques quando HP está cheio', () => {
    const defender = createDummy({ name: 'Terapagos', ability: 'tera-shell', hp: 100, maxHP: 100 });
    const logs: LogEntry[] = [];

    // Ataque neutro (1.0) -> vira 0.5
    const multiplierNeutral = getDamageMultiplier(defender, 1.0, logs);
    expect(multiplierNeutral).toBe(0.5); // 1.0 * 0.5 = 0.5
    expect(logs[0].message).toContain('resistiu ao ataque');

    // Ataque super efetivo (2.0) -> vira 0.5
    const multiplierSuper = getDamageMultiplier(defender, 2.0, logs);
    expect(multiplierSuper).toBe(0.25); // 2.0 * 0.25 = 0.5
  });

  it('não deve resistir se HP não estiver cheio', () => {
    const defender = createDummy({ name: 'Terapagos', ability: 'tera-shell', hp: 99, maxHP: 100 });
    const logs: LogEntry[] = [];

    const multiplier = getDamageMultiplier(defender, 1.0, logs);
    expect(multiplier).toBe(1.0);
    expect(logs.length).toBe(0);
  });

  it('não deve alterar ataques já resistidos (<= 0.5)', () => {
    const defender = createDummy({ name: 'Terapagos', ability: 'tera-shell', hp: 100, maxHP: 100 });
    const logs: LogEntry[] = [];

    // Ataque já resistido (0.5) -> mantém 0.5 (retorna 1.0)
    const multiplierResisted = getDamageMultiplier(defender, 0.5, logs);
    expect(multiplierResisted).toBe(1.0); // 0.5 * 1.0 = 0.5
  });
});
