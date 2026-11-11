import { describe, it, expect } from 'vitest';
import { handleStrengthSap } from '../../services/engine/handlers/moves/strengthSap';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Strength Sap', () => {
  it('deve curar o usuário e reduzir o ataque do alvo', () => {
    const attacker = createDummy({ name: 'Shiinotic', hp: 50, maxHP: 100 });
    const defender = createDummy({ name: 'Machamp', attackStat: 130 });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    // Execução
    handleStrengthSap(attacker, defender, logs, state);

    // Validação
    expect(attacker.hp).toBeGreaterThan(50); // Deve ter curado
    expect(defender.statStages.attack).toBe(-1); // Deve ter reduzido ataque
  });

  it('deve falhar se o ataque do alvo já estiver em -6', () => {
    const attacker = createDummy({ name: 'Shiinotic', hp: 50, maxHP: 100 });
    const defender = createDummy({ name: 'Machamp' });
    defender.statStages.attack = -6;
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handleStrengthSap(attacker, defender, logs, state);

    expect(attacker.hp).toBe(50); // Não deve curar
    expect(defender.statStages.attack).toBe(-6); // Mantém em -6
    expect(logs.some(l => l.message.includes('não pode diminuir mais'))).toBe(true);
  });

  it('deve falhar se o alvo tiver Clear Body', () => {
    const attacker = createDummy({ name: 'Shiinotic', hp: 50, maxHP: 100 });
    const defender = createDummy({ name: 'Metagross', ability: 'clear-body' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handleStrengthSap(attacker, defender, logs, state);

    expect(attacker.hp).toBe(50); // Não deve curar
    expect(defender.statStages.attack).toBe(0); // Não reduz
    expect(logs.some(l => l.message.includes('impediu a Drenagem de Força'))).toBe(true);
  });
});
