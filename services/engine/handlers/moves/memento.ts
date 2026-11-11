
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatMoves from './statChanges';

/**
 * Lógica para o movimento Memento.
 * Regra Oficial: O usuário desmaia e diminui o Ataque e o Atq. Especial do alvo em 2 estágios.
 * Se o alvo estiver protegido ou imune, o usuário não desmaia (Gen 7+), 
 * mas aqui simplificamos para o comportamento padrão onde a tentativa ocorre.
 */
export function handleMemento(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: {message: string, color: string}[], 
    state: BattleState
) {
    if (attacker.isFainted || defender.isFainted) return;

    // Aplica redução de Ataque (-2)
    // A magnitude é controlada em statChanges.ts verificando o nome do movimento
    StatMoves.applyMoveStatChange(
        defender, 
        'attack-down', 
        logs, 
        true, // isOpponentSource
        false, // ignoresAbilities
        'memento', 
        state
    );

    // Aplica redução de Ataque Especial (-2)
    StatMoves.applyMoveStatChange(
        defender, 
        'spAttack-down', 
        logs, 
        true, 
        false, 
        'memento', 
        state
    );

    // O usuário se sacrifica
    log(logs, `${attacker.name} se sacrificou para enfraquecer o oponente!`, 'text-red-900 font-bold');
    attacker.hp = 0;
    attacker.isFainted = true;
}
