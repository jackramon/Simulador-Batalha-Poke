import { describe, it, expect } from 'vitest';
import { triggerDesolateLand, isDesolateLandActive } from '../../services/engine/handlers/abilities/desolate_land';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';
import { validateMoveExecution } from '../../services/engine/steps/preMoveValidation';

describe('Desolate Land', () => {
  it('deve invocar sol forte ao entrar em campo', () => {
    const attacker = createDummy({ name: 'Groudon', ability: 'desolate-land' });
    const defender = createDummy({ name: 'Defensor' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    const newWeather = triggerDesolateLand(attacker, state, logs);
    
    expect(newWeather).toBe('sun');
    expect(logs.some(l => l.message.includes('intensificou os raios solares ao extremo'))).toBe(true);
  });

  it('deve evaporar ataques de Água', () => {
    const attacker = createDummy({ name: 'Kyogre' });
    const defender = createDummy({ name: 'Groudon', ability: 'desolate-land' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);
    state.weather = 'sun'; // Simula que o clima já foi ativado

    const move = { name: 'surf', displayName: 'Surf', type: 'water', damageClass: 'special', power: 90, accuracy: 100, isStatus: false, description: '', uses: 0, maxUses: 10 };
    
    const result = validateMoveExecution(state, attacker, defender, move, { p1Mode: 'manual', p1TeamSize: 1, p1Input: '', p2Mode: 'manual', p2TeamSize: 1, p2Input: '', opponentMode: 'manual', weatherEnabled: true, terrainEnabled: true, itemsEnabled: true, terastallizationEnabled: false, megaEvolutionEnabled: false, moveLimitEnabled: false, p1AutoMode: false, randomIvs: false, randomLevels: false }, undefined, false, false, false);

    expect(result.canProceed).toBe(false);
    expect(result.logs.some(l => l.message.includes('evaporou no calor extremo'))).toBe(true);
  });
});
