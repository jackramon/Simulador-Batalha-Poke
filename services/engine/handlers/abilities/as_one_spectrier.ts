
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Unidade (As One - Spectrier).
 * Regra: Combina os efeitos de Tensão (Unnerve) e Relincho Sinistro (Grim Neigh).
 * - Tensão: Impede oponentes de comer frutas (Gerenciado em unnerve.ts).
 * - Relincho Sinistro: Aumenta o Atq. Especial ao nocautear um oponente.
 * 
 * Esta habilidade não pode ser suprimida, copiada ou trocada.
 */

export function checkGrimNeighBoost(pokemon: Pokemon, logs: LogEntry[]) {
    // Aplica o boost se for Unidade (Spectrier) OU Relincho Sinistro (Grim Neigh) puro
    if (['as-one-spectrier', 'grim-neigh'].includes(pokemon.ability) && !pokemon.isFainted) {
         if (pokemon.statStages.spAttack < 6) {
             pokemon.statStages.spAttack++;
             
             const abilityName = pokemon.ability === 'as-one-spectrier' ? 'Unidade' : 'Relincho Sinistro';
             log(logs, `${pokemon.name} aumentou seu Atq. Especial devido a ${abilityName}!`, 'text-green-600 font-bold');
         }
    }
}
