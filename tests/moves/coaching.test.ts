import { describe, it, expect } from 'vitest';
import { handleCoaching } from '../../services/engine/handlers/moves/coaching';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Coaching', () => {
  it('deve aumentar Attack e Defense do usuário (Adaptação 1v1)', () => {
    const attacker = createDummy({ name: 'Riolu' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);

    handleCoaching(attacker, logs, state);

    expect(attacker.statStages.attack).toBe(1);
    expect(attacker.statStages.defense).toBe(1);
    expect(logs.some(l => l.message.includes('treinando'))).toBe(true);
  });
});
