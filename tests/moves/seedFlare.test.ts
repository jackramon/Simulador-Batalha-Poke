import { describe, it, expect } from 'vitest';
import { handleSeedFlareEffect } from '../../services/engine/handlers/moves/seedFlare';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Seed Flare', () => {
  it('should lower the target\'s Sp. Def by 2 stages', () => {
    const attacker = createDummy({ name: 'Shaymin-Sky' });
    const defender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100, statStages: { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 } });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handleSeedFlareEffect(attacker, defender, logs, state);

    expect(defender.statStages.spDefense).toBe(-2);
  });
});
