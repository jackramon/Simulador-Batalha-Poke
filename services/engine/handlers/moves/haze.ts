
import { BattleState, LogEntry, Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Neblina (Haze).
 * Categoria: Status.
 * Efeito: Elimina todas as mudanças de estágios de atributos de TODOS os Pokémon em campo.
 * Reseta para 0: Attack, Defense, SpAttack, SpDefense, Speed, Accuracy, Evasion.
 * Ignora: Substitutos e Proteções (pois afeta o campo).
 */
export function handleHaze(
    state: BattleState,
    logs: LogEntry[]
) {
    if (!state) return;

    const targets = [state.currentPokemon1, state.currentPokemon2].filter(p => p && !p.isFainted) as Pokemon[];
    
    targets.forEach(p => {
        p.statStages = {
            accuracy: 0,
            evasion: 0,
            attack: 0,
            defense: 0,
            spAttack: 0,
            spDefense: 0,
            speed: 0
        };
    });

    log(logs, `A neblina eliminou todas as mudanças de atributos!`, 'text-blue-400 font-bold italic');
}
