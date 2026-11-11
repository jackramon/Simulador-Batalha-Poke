import { describe, it, expect } from 'vitest';
import { getPsybladePower } from '../../services/engine/handlers/moves/psyblade';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Psyblade', () => {
  it('deve retornar poder base (80) sem terreno elétrico', () => {
    const attacker = createDummy({ name: 'Iron Leaves' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);
    
    const power = getPsybladePower(attacker, 80, state, logs);
    
    expect(power).toBe(80);
  });

  it('deve aumentar o poder em 50% (120) com terreno elétrico', () => {
    const attacker = createDummy({ name: 'Iron Leaves' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);
    
    state.terrain = 'electric';
    
    const power = getPsybladePower(attacker, 80, state, logs);
    
    expect(power).toBe(120);
    expect(logs.some(l => l.message.includes('Terreno Elétrico'))).toBe(true);
  });
});
