import { describe, it, expect } from 'vitest';
import { handleMagneticFlux } from '../../services/engine/handlers/moves/magneticFlux';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Magnetic Flux', () => {
  it('deve aumentar Defesa e Sp. Def se o usuário tiver a habilidade Plus', () => {
    const attacker = createDummy({ name: 'Plusle', ability: 'plus' });
    const defender = createDummy({ name: 'Minun' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handleMagneticFlux(attacker, logs, state);

    expect(attacker.statStages.defense).toBe(1);
    expect(attacker.statStages.spDefense).toBe(1);
    expect(logs.some(l => l.message.includes('aumentou'))).toBe(true);
  });

  it('deve aumentar Defesa e Sp. Def se o usuário tiver a habilidade Minus', () => {
    const attacker = createDummy({ name: 'Minun', ability: 'minus' });
    const defender = createDummy({ name: 'Plusle' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handleMagneticFlux(attacker, logs, state);

    expect(attacker.statStages.defense).toBe(1);
    expect(attacker.statStages.spDefense).toBe(1);
  });

  it('deve falhar se o usuário não tiver a habilidade Plus ou Minus', () => {
    const attacker = createDummy({ name: 'Pikachu', ability: 'static' });
    const defender = createDummy({ name: 'Eevee' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handleMagneticFlux(attacker, logs, state);

    expect(attacker.statStages.defense).toBe(0);
    expect(attacker.statStages.spDefense).toBe(0);
    expect(logs.some(l => l.message.includes('falhou'))).toBe(true);
  });
});
