import { describe, it, expect } from 'vitest';
import { handlePlasmaFistsEffect } from '../../services/engine/handlers/moves/plasmaFists';
import { resolveEffectiveType } from '../../services/engine/movePipeline';
import { createDummy, createBattleState } from '../factories';
import { LogEntry, Move } from '../../types';

describe('Plasma Fists', () => {
  it('should apply plasma-fists status to both active Pokémon', () => {
    const attacker = createDummy({ name: 'Zeraora' });
    const defender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handlePlasmaFistsEffect(attacker, defender, logs, state);

    expect(attacker.statusEffects['plasma-fists']).toBeDefined();
    expect(defender.statusEffects['plasma-fists']).toBeDefined();
  });

  it('should convert Normal-type moves to Electric-type for the rest of the turn', () => {
    const attacker = createDummy({ name: 'Zeraora' });
    const defender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    // Apply the effect
    handlePlasmaFistsEffect(attacker, defender, logs, state);

    // Simulate the defender using a Normal-type move
    const normalMove: Move = { name: 'tackle', type: 'normal' } as Move;
    const ctx = {
      attacker: defender,
      move: normalMove,
      state,
      effectiveWeather: 'none',
      isGasActive: false,
      ignoresAbilities: false,
      logs: []
    } as any;

    const resolvedCtx = resolveEffectiveType(ctx);

    expect(resolvedCtx.effectiveType).toBe('electric');
  });
});
