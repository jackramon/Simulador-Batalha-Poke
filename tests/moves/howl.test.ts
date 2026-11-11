import { describe, it, expect } from 'vitest';
import { handleHowl } from '../../services/engine/handlers/moves/howl';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Uivo (Howl)', () => {
  it('deve aumentar o Ataque do atacante em 1 estágio', () => {
    const attacker = createDummy({ name: 'Atacante' });
    const defender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    // Estado inicial deve ser 0
    expect(attacker.statStages.attack).toBe(0);

    // Execução
    handleHowl(attacker, logs, state);

    // Validação
    expect(attacker.statStages.attack).toBe(1);
    expect(logs.some(l => l.message.includes('Ataque aumentado'))).toBe(true);
  });

  it('não deve aumentar o Ataque além do limite de +6', () => {
    const attacker = createDummy({ name: 'Atacante' });
    attacker.statStages.attack = 6;
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], []);

    handleHowl(attacker, logs, state);

    expect(attacker.statStages.attack).toBe(6);
    expect(logs.some(l => l.message.includes('não pode ter Ataque alterado mais'))).toBe(true);
  });
});
