import { Pokemon, BattleState } from '../../../../types';
import { applyStatus } from '../effects/statusConditions';
import { log } from '../../utils';

/**
 * Handler para o efeito secundário de Steam Eruption.
 * 
 * Efeito:
 * - 30% de chance de causar Burn (Queimadura) no alvo.
 * - Descongela o usuário se estiver congelado (tratado implicitamente se o movimento for executado com sucesso,
 *   mas reforçado aqui caso a mecânica de thawing pré-ataque não esteja ativa).
 */
export function handleSteamEruptionEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Aplica Burn no alvo
    applyStatus(defender, 'burn', logs, attacker, false, state);

    // Lógica de segurança para descongelamento (caso o ataque tenha ocorrido mas o status não tenha sido limpo)
    if (attacker.statusEffects.freeze) {
        delete attacker.statusEffects.freeze;
        log(logs, `${attacker.name} derreteu o gelo com o vapor quente!`, 'text-red-500 font-bold');
    }
}
