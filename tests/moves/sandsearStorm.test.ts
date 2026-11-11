import { describe, it, expect } from 'vitest';
import { handleSandsearStormEffect } from '../../services/engine/handlers/moves/sandsearStorm';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Sandsear Storm', () => {
  it('deve aplicar queimadura no alvo', () => {
    const attacker = createDummy({ name: 'Landorus' });
    const defender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    // Execução
    handleSandsearStormEffect(attacker, defender, logs, state);

    // Validação
    expect(defender.statusEffects['burn']).toBeDefined();
    expect(logs.some(l => l.message.includes('Queimadura'))).toBe(true);
  });

  it('não deve aplicar queimadura se o alvo já tiver status', () => {
    const attacker = createDummy({ name: 'Landorus' });
    const defender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
    defender.statusEffects['paralysis'] = { turns: 1 };
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    // Execução
    handleSandsearStormEffect(attacker, defender, logs, state);

    // Validação
    expect(defender.statusEffects['burn']).toBeUndefined();
    expect(defender.statusEffects['paralysis']).toBeDefined();
  });
});
