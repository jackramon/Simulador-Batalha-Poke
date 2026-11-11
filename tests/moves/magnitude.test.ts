import { describe, it, expect } from 'vitest';
import { getMagnitudePower } from '../../services/engine/handlers/moves/magnitude';
import { createDummy } from '../factories';
import { LogEntry } from '../../types';

describe('Magnitude', () => {
  it('deve retornar um valor de poder válido (10, 30, 50, 70, 90, 110, 150)', () => {
    const attacker = createDummy({ name: 'Golem' });
    const logs: LogEntry[] = [];
    
    const validPowers = [10, 30, 50, 70, 90, 110, 150];
    
    // Executa várias vezes para garantir que cai em algum range válido
    for (let i = 0; i < 20; i++) {
        const power = getMagnitudePower(attacker, logs);
        expect(validPowers).toContain(power);
    }
  });

  it('deve adicionar log de Magnitude', () => {
    const attacker = createDummy({ name: 'Dugtrio' });
    const logs: LogEntry[] = [];
    
    getMagnitudePower(attacker, logs);
    
    expect(logs.some(l => l.message.includes('Magnitude'))).toBe(true);
  });
});
