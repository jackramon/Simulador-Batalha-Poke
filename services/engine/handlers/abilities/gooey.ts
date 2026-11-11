
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatMoves from '../moves/statChanges';

/**
 * Lógica para a habilidade Viscosidade (Gooey) e Cabelo Emaranhado (Tangling Hair).
 * Regra Oficial: Quando o Pokémon é atingido por um movimento de contato, 
 * a Velocidade do atacante é reduzida em 1 estágio.
 */
export function handleGooey(
    attacker: Pokemon, 
    defender: Pokemon, 
    isContact: boolean, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (!isContact || defender.isFainted || attacker.isFainted) return;

    const gooeyAbilities = ['gooey', 'tangling-hair'];
    if (gooeyAbilities.includes(defender.ability)) {
        const abilityName = defender.ability === 'gooey' ? 'Viscosidade' : 'Cabelo Emaranhado';
        
        log(logs, `A ${abilityName} de ${defender.name} retardou o atacante!`, 'text-indigo-600 italic');
        
        // Reduz a velocidade do atacante em 1 estágio
        StatMoves.applyMoveStatChange(
            attacker, 
            'speed-down', 
            logs, 
            true,  // isOpponentSource: Sim, o defensor é o oponente do atacante
            false, // ignoresAbilities: Gooey não ignora habilidades defensivas do alvo (ex: Clear Body)
            defender.ability,
            state
        );
    }
}
