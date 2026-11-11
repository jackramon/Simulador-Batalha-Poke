
import { Pokemon, Action } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Estrondo (Thunderclap).
 * Prioridade: +1
 * Regra Oficial: Falha se o alvo não estiver preparando um ataque ou se o alvo já tiver agido no turno.
 * É essencialmente uma variante elétrica de Sucker Punch.
 */
export function checkFailure(
    attacker: Pokemon, 
    defender: Pokemon, 
    defenderAction: Action | undefined, 
    logs: {message: string, color: string}[]
): boolean {
    // 1. Se o defensor já agiu no turno (atacou primeiro), falha
    if (defender.movedThisTurn) {
        log(logs, BATTLE_MESSAGES.SUCKER_PUNCH_FAIL(), 'text-gray-500 italic');
        return true;
    }

    // 2. Se a ação não é um movimento (ex: troca de Pokémon, uso de item)
    if (!defenderAction || defenderAction.type !== 'move') {
        log(logs, BATTLE_MESSAGES.SUCKER_PUNCH_FAIL(), 'text-gray-500 italic');
        return true;
    }

    // 3. Se o movimento selecionado pelo defensor é de Status (não ofensivo)
    const defenderMove = defenderAction.data;
    if (defenderMove && defenderMove.damageClass === 'status') {
        log(logs, BATTLE_MESSAGES.SUCKER_PUNCH_FAIL(), 'text-gray-500 italic');
        return true;
    }

    // Se passou por todas as checagens, o golpe funciona
    return false;
}
