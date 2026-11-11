import { describe, it, expect } from 'vitest';
import { handleFleurCannonEffect } from '../../services/engine/handlers/moves/fleurCannon';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Fleur Cannon', () => {
  it('deve reduzir o Ataque Especial do usuário em 2 estágios', () => {
    const attacker = createDummy({ name: 'Magearna', spAttackStat: 100 });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);

    // Execução
    handleFleurCannonEffect(attacker, logs, state);

    // Validação
    expect(attacker.statStages.spAttack).toBe(-2);
    expect(logs.some(log => log.message.includes('diminuiu muito'))).toBe(true);
  });

  it('não deve reduzir abaixo de -6', () => {
    const attacker = createDummy({ name: 'Magearna', spAttackStat: 100 });
    attacker.statStages.spAttack = -5;
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);

    // Execução
    handleFleurCannonEffect(attacker, logs, state);

    // Validação
    expect(attacker.statStages.spAttack).toBe(-6);
  });
});
