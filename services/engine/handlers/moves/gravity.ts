
import { BattleState, LogEntry, Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Gravidade (Gravity).
 * Efeito:
 * 1. Aumenta a gravidade no campo por 5 turnos.
 * 2. Traz todos os Pokémon flutuantes para o chão (aterramento).
 * 3. Aumenta a precisão de todos os movimentos em 5/3 (~1.67x).
 * 4. Falha se a Gravidade já estiver ativa.
 */
export function handleGravity(
    state: BattleState, 
    logs: LogEntry[]
) {
    if (state.gravity) {
        log(logs, `Mas falhou! A gravidade já está intensa.`, 'text-gray-500 italic');
        return;
    }

    state.gravity = true;
    state.gravityTurns = 5;

    log(logs, `A gravidade se intensificou!`, 'text-purple-700 font-bold italic');

    // Cancela movimentos semi-invulneráveis no ar
    const activePokemons = [state.currentPokemon1, state.currentPokemon2].filter(p => p && !p.isFainted) as Pokemon[];

    activePokemons.forEach(p => {
        let broughtDown = false;
        
        if (p.statusEffects['flying']) {
            delete p.statusEffects['flying'];
            broughtDown = true;
        }
        if (p.statusEffects['bouncing']) {
            delete p.statusEffects['bouncing'];
            broughtDown = true;
        }
        if (p.statusEffects['telekinesis']) {
            delete p.statusEffects['telekinesis'];
            broughtDown = true;
        }
        if (p.statusEffects['magnet-rise']) {
            delete p.statusEffects['magnet-rise'];
            broughtDown = true;
        }

        // Se estava carregando um movimento aéreo, o movimento é cancelado/interrompido
        if (broughtDown && (p.chargingMove === 'fly' || p.chargingMove === 'bounce')) {
             p.chargingMove = null;
             log(logs, `${p.name} caiu no chão devido à gravidade!`, 'text-red-500 font-bold');
        }
    });
}
