import { describe, it, expect } from 'vitest';
import { getRevengePower } from '../../services/engine/handlers/moves/revenge';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Revenge', () => {
  it('deve dobrar o poder se o usuário foi atingido pelo alvo no mesmo turno', () => {
    const attacker = createDummy({ name: 'Machamp' });
    const defender = createDummy({ name: 'Alakazam' });
    
    // Simula que o atacante foi atingido pelo defensor (avalanche-tracker)
    attacker.statusEffects['avalanche-tracker'] = {
        turns: 1,
        sourceMoveName: defender.id.toString()
    };

    const result = getRevengePower(attacker, defender, 60);
    
    expect(result.power).toBe(120);
    expect(result.isBoosted).toBe(true);
  });

  it('não deve dobrar o poder se o usuário não foi atingido', () => {
    const attacker = createDummy({ name: 'Machamp' });
    const defender = createDummy({ name: 'Alakazam' });
    
    // Sem tracker

    const result = getRevengePower(attacker, defender, 60);
    
    expect(result.power).toBe(60);
    expect(result.isBoosted).toBe(false);
  });

  it('não deve dobrar o poder se o usuário foi atingido por outro Pokémon', () => {
    const attacker = createDummy({ name: 'Machamp' });
    const defender = createDummy({ name: 'Alakazam' });
    const other = createDummy({ name: 'Gengar', id: 999 });
    
    // Atingido por outro
    attacker.statusEffects['avalanche-tracker'] = {
        turns: 1,
        sourceMoveName: other.id.toString()
    };

    const result = getRevengePower(attacker, defender, 60);
    
    expect(result.power).toBe(60);
    expect(result.isBoosted).toBe(false);
  });
});
