import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';
import * as MoldBreaker from './mold_breaker';

/**
 * Lógica para as habilidades Ofuscante (Dazzling), Majestade Real (Queenly Majesty) 
 * e Cauda de Armadura (Armor Tail).
 * Regra Oficial: Impede o oponente de usar movimentos de prioridade contra este Pokémon.
 */

export function blocksPriorityMove(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    state: BattleState
): boolean {
    const protectiveAbilities = ['dazzling', 'queenly-majesty', 'armor-tail'];
    
    if (!protectiveAbilities.includes(defender.ability) || defender.isFainted) {
        return false;
    }

    // Apenas movimentos com prioridade positiva (> 0) são bloqueados
    const priority = move.priority || 0;
    if (priority <= 0) {
        return false;
    }

    // A habilidade não bloqueia movimentos que o Pokémon usa em si mesmo
    if (attacker === defender) {
        return false;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(defender, state)) {
        return false;
    }

    // Verifica se o atacante ignora habilidades defensivas (Mold Breaker)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);
    if (ignoresAbilities) {
        return false;
    }

    return true;
}

export function logPriorityBlocked(defender: Pokemon, logs: {message: string, color: string}[]) {
    const abilityNames: Record<string, string> = {
        'dazzling': 'Ofuscante',
        'queenly-majesty': 'Majestade Real',
        'armor-tail': 'Cauda de Armadura'
    };
    const name = abilityNames[defender.ability] || defender.ability;
    log(logs, `${defender.name} protegeu-se de ataques prioritários com ${name}!`, 'text-indigo-600 italic font-bold');
}
