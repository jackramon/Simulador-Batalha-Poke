
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Klutz from '../abilities/klutz';

/**
 * Lógica para o movimento Levitação Magnética (Magnet Rise).
 * Regra Oficial: O usuário levita eletromagneticamente por 5 turnos.
 * Durante este tempo, torna-se imune a movimentos do tipo Terra, Spikes e Toxic Spikes.
 * Falha se:
 * - Já estiver ativo.
 * - Estiver sob efeito de Ingrain, Smack Down ou segurando Iron Ball.
 */
export function handleMagnetRise(
    attacker: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // 1. Verifica se já está ativo
    if (attacker.statusEffects['magnet-rise']) {
        log(logs, `Mas falhou! ${attacker.name} já está levitando com magnetismo.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica impedimentos de aterramento (Ingrain, Smack Down)
    if (attacker.statusEffects['ingrain'] || attacker.statusEffects['smack-down'] || attacker.statusEffects['grounded']) {
        log(logs, `Mas falhou! ${attacker.name} está preso ao chão.`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica Iron Ball (Bola de Ferro)
    // Se tiver Klutz ou Magic Room (não implementado), Iron Ball é ignorada e Magnet Rise funciona.
    if (attacker.heldItem === 'iron-ball' && !Klutz.isItemSuppressed(attacker, state)) {
        log(logs, `Mas falhou! A Bola de Ferro pesa demais.`, 'text-gray-500 italic');
        return;
    }

    // 4. Aplica o efeito (5 turnos)
    attacker.statusEffects['magnet-rise'] = { turns: 5 };
    log(logs, `${attacker.name} levitou com eletromagnetismo!`, 'text-yellow-500 font-bold');
}
