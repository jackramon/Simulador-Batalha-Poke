import { describe, it, expect } from 'vitest';
import { handleSpinOutEffect } from '../../services/engine/handlers/moves/spinOut';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Spin Out', () => {
  it('deve reduzir a velocidade do usuário em 2 estágios', () => {
    const attacker = createDummy({ name: 'Varoom' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);

    handleSpinOutEffect(attacker, logs, state);

    expect(attacker.statStages.speed).toBe(-2);
    expect(logs.some(l => l.message.includes('diminuiu muito'))).toBe(true);
  });

  it('não deve reduzir abaixo de -6', () => {
    const attacker = createDummy({ name: 'Varoom', statStages: { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: -5 } });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);

    handleSpinOutEffect(attacker, logs, state);

    expect(attacker.statStages.speed).toBe(-6);
  });
});
