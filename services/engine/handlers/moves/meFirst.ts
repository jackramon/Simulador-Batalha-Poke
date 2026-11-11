
import { Pokemon, Move, Action, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Eu Primeiro (Me First).
 * Regras Oficiais:
 * 1. O usuário tenta usar o mesmo movimento que o alvo escolheu para este turno.
 * 2. Funciona apenas se o usuário for mais rápido (atacar antes do alvo).
 * 3. Funciona apenas se o movimento do alvo for de dano (Damage Class != Status).
 * 4. O movimento copiado tem seu poder aumentado em 50% (1.5x).
 * 5. Falha se o alvo já agiu no turno ou se o movimento selecionado for de Status.
 */
export function handleMeFirst(
    attacker: Pokemon, 
    defender: Pokemon, 
    defenderAction: Action | undefined, 
    logs: LogEntry[]
): Move | null {
    // 1. Verifica se o defensor já agiu
    if (defender.movedThisTurn) {
        log(logs, `Mas falhou! ${defender.name} já agiu.`, 'text-gray-500 italic');
        return null;
    }

    // 2. Verifica se o defensor tem uma ação de movimento válida
    if (!defenderAction || defenderAction.type !== 'move') {
        log(logs, `Mas falhou! O alvo não está usando um ataque.`, 'text-gray-500 italic');
        return null;
    }

    const targetMove = defenderAction.data as Move;

    // 3. Verifica se o movimento é de Status (Me First só copia ataques de dano)
    if (targetMove.damageClass === 'status') {
        log(logs, `Mas falhou! ${targetMove.displayName} não é um ataque de dano.`, 'text-gray-500 italic');
        return null;
    }

    // 4. Sucesso: Retorna o movimento copiado com bônus de poder
    log(logs, `${attacker.name} cortou a frente de ${defender.name} com Eu Primeiro!`, 'text-indigo-600 font-bold italic');

    return {
        ...targetMove,
        power: Math.floor(targetMove.power * 1.5), // Aumento de 50%
        displayName: `Eu Primeiro (${targetMove.displayName})` // Flavor text opcional para UI
    };
}
