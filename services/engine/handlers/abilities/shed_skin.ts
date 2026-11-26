
import { Pokemon } from '../../../../types';
import { BattlePRNG, nextBattleRandom } from '../../../../utils/prng';
import { log, LogEntry } from '../../utils';

/**
 * Lógica para a habilidade Troca de Pele (Shed Skin).
 * Regra: No final de cada turno, tem 1/3 (aproximadamente 33.3%) de chance 
 * de curar o usuário de qualquer condição de status principal.
 */
export function handleShedSkin(pokemon: Pokemon, logs: LogEntry[], prng?: BattlePRNG): boolean {
    if (pokemon.ability !== 'shed-skin' || pokemon.isFainted) return false;

    const statusList = Object.keys(pokemon.statusEffects);
    const hasMajorStatus = statusList.some(s => 
        ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(s)
    );

    if (hasMajorStatus && nextBattleRandom(undefined, prng) < 1/3) {
        // Limpa todos os status principais
        pokemon.statusEffects = {};
        log(logs, `${pokemon.name} trocou de pele e curou seus status!`, 'text-blue-500 font-bold');
        return true;
    }
    
    return false;
}
