import { describe, it, expect } from 'vitest';
import { handlePerishSongStart, handlePerishCount } from '../../services/engine/handlers/moves/perish_song';
import { createDummy, createBattleState } from '../factories';
import { LogEntry } from '../../types';

describe('Perish Song', () => {
  it('deve aplicar o status perish-song em ambos os pokémon', () => {
    const attacker = createDummy({ name: 'Lapras' });
    const defender = createDummy({ name: 'Politoed' });
    const logs: LogEntry[] = [];
    const state = createBattleState([attacker], [defender]);

    handlePerishSongStart(attacker, logs, state);

    expect(attacker.statusEffects['perish-song']).toBeDefined();
    expect(attacker.statusEffects['perish-song'].turns).toBe(4);
    expect(defender.statusEffects['perish-song']).toBeDefined();
    expect(defender.statusEffects['perish-song'].turns).toBe(4);
  });

  it('deve decrementar a contagem e desmaiar o pokémon quando chegar a 0', () => {
    const pokemon = createDummy({ name: 'Gengar' });
    const logs: LogEntry[] = [];
    
    // Inicia com 1 turno restante (vai para 0 agora)
    pokemon.statusEffects['perish-song'] = { turns: 1 };

    handlePerishCount(pokemon, logs);

    expect(pokemon.isFainted).toBe(true);
    expect(pokemon.hp).toBe(0);
    expect(logs.some(l => l.message.includes('chegou a 0'))).toBe(true);
  });
});
