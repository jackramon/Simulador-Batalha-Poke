
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Soco Focalizado (Focus Punch).
 * Regra Oficial: Falha se o usuário sofrer dano direto de um ataque neste turno antes de executar o golpe.
 * Prioridade: -3 (Geralmente age por último).
 */
export function checkFocusPunchFailure(attacker: Pokemon, logs: {message: string, color: string}[]): boolean {
    // Verifica se os rastreadores de dano sofrido neste turno estão ativos
    // Esses status são definidos em services/engine/moves.ts durante o cálculo de dano
    const tookPhysicalDamage = !!attacker.statusEffects['physical-damage-taken'];
    const tookSpecialDamage = !!attacker.statusEffects['special-damage-taken'];
    const tookGenericDamage = !!attacker.statusEffects['avalanche-tracker']; // Tracker genérico de "recebeu dano"

    if (tookPhysicalDamage || tookSpecialDamage || tookGenericDamage) {
        log(logs, BATTLE_MESSAGES.FOCUS_PUNCH_FAIL(attacker.name), 'text-gray-500 italic');
        return true;
    }

    return false;
}
