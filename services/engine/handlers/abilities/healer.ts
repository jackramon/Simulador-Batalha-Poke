import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Curandeiro (Healer).
 * Regra Oficial: Em batalhas em dupla, cura aliados. 
 * Adaptação para Duelo (1v1): No final de cada turno, tem 30% de chance de curar 
 * uma condição de status do próprio usuário.
 */
export function handleHealer(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]): boolean {
    // Requisitos: Ter a habilidade, estar vivo e ter um status principal
    if (pokemon.ability !== 'healer' || pokemon.isFainted) {
        return false;
    }

    const majorStatus = ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'];
    const hasStatus = Object.keys(pokemon.statusEffects).some(s => majorStatus.includes(s));

    if (!hasStatus) {
        return false;
    }

    // Respeita o Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    // 30% de chance de curar
    if (Math.random() < 0.3) {
        // Limpa os status principais
        majorStatus.forEach(s => {
            if (pokemon.statusEffects[s]) {
                delete pokemon.statusEffects[s];
            }
        });

        log(logs, `A habilidade Curandeiro de ${pokemon.name} curou sua condição de status!`, 'text-green-500 font-bold italic');
        return true;
    }

    return false;
}