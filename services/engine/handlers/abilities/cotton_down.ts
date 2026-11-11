import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatMoves from '../moves/statChanges';

/**
 * Lógica para a habilidade Penugem de Algodão (Cotton Down).
 * Regra Oficial: Quando atingido por um ataque, reduz a velocidade de todos os outros Pokémon em 1 estágio.
 */
export function handleCottonDown(
    defender: Pokemon,
    attacker: Pokemon,
    state: BattleState,
    logs: {message: string, color: string}[]
) {
    if (defender.ability !== 'cotton-down') return;

    // Em 1v1, "todos os outros" refere-se apenas ao atacante.
    // Usamos applyMoveStatChange para garantir que habilidades como Clear Body do atacante sejam respeitadas.
    log(logs, `A Penugem de Algodão de ${defender.name} se espalhou!`, 'text-indigo-600 italic');
    
    StatMoves.applyMoveStatChange(
        attacker,
        'speed-down',
        logs,
        true,  // isOpponentSource: Sim, o portador da habilidade é o oponente de quem recebe o debuff
        false, // ignoresAbilities: Cotton Down não ignora habilidades defensivas do alvo
        'cotton-down',
        state
    );
}
