import { describe, it, expect } from 'vitest';
import { handleIonDeluge, getEffectiveMoveType } from '../../services/engine/handlers/moves/ionDeluge';
import { createDummy, createBattleState } from '../factories';
import { LogEntry, Move } from '../../types';

describe('Ion Deluge', () => {
  it('deve ativar o efeito de Ion Deluge no campo', () => {
    const attacker = createDummy({ name: 'Zeraora' });
    const defender = createDummy({ name: 'Defensor' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handleIonDeluge(attacker, defender, logs, state);

    expect(state.ionDelugeActive).toBe(true);
    expect(logs[0].message).toContain('Uma chuva de íons cobriu o campo de batalha!');
  });

  it('deve transformar movimentos do tipo Normal em Elétrico quando ativo', () => {
    const state = createBattleState([], []);
    state.ionDelugeActive = true;

    const normalMove: Move = {
        name: 'tackle',
        displayName: 'Tackle',
        type: 'normal',
        power: 40,
        accuracy: 100,
        damageClass: 'physical',
        isStatus: false,
        uses: 35,
        maxUses: 35,
        description: ''
    };

    const effectiveType = getEffectiveMoveType(state, normalMove);
    expect(effectiveType).toBe('electric');
  });

  it('não deve transformar movimentos de outros tipos', () => {
    const state = createBattleState([], []);
    state.ionDelugeActive = true;

    const fireMove: Move = {
        name: 'ember',
        displayName: 'Ember',
        type: 'fire',
        power: 40,
        accuracy: 100,
        damageClass: 'special',
        isStatus: false,
        uses: 25,
        maxUses: 25,
        description: ''
    };

    const effectiveType = getEffectiveMoveType(state, fireMove);
    expect(effectiveType).toBe('fire');
  });

  it('não deve transformar movimentos se Ion Deluge não estiver ativo', () => {
    const state = createBattleState([], []);
    state.ionDelugeActive = false;

    const normalMove: Move = {
        name: 'tackle',
        displayName: 'Tackle',
        type: 'normal',
        power: 40,
        accuracy: 100,
        damageClass: 'physical',
        isStatus: false,
        uses: 35,
        maxUses: 35,
        description: ''
    };

    const effectiveType = getEffectiveMoveType(state, normalMove);
    expect(effectiveType).toBe('normal');
  });
});
