
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from './statChanges';

/**
 * Lógica para o movimento Autotomizar (Autotomize).
 * Regras Oficiais:
 * 1. Aumenta a Velocidade do usuário em 2 estágios.
 * 2. Reduz o peso do usuário em 100 kg (1000 hectogramas).
 * 3. A redução de peso acumula a cada uso.
 */
export function handleAutotomize(
    attacker: Pokemon, 
    logs: {message: string, color: string}[], 
    state?: BattleState
) {
    // 1. Aumenta Velocidade (+2)
    // O nome do movimento 'autotomize' é verificado em statChanges.ts para garantir magnitude 2
    StatChanges.applyMoveStatChange(
        attacker,
        'speed-up',
        logs,
        false, // isOpponentSource
        false, // ignoresAbilities
        'autotomize',
        state
    );

    // 2. Reduz o Peso
    if (!attacker.statusEffects['autotomize-weight']) {
        attacker.statusEffects['autotomize-weight'] = { 
            turns: -1, // Permanente enquanto estiver em campo
            damageAccumulated: 1 // Contador de usos (1 uso = -100kg)
        };
    } else {
        attacker.statusEffects['autotomize-weight'].damageAccumulated! += 1;
    }

    log(logs, `${attacker.name} ficou mais leve e ágil!`, 'text-gray-500 font-bold italic');
}
