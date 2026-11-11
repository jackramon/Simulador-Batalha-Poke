
import { Pokemon, Move } from '../../../../types';
import * as Effects from '../../../effectHandlers';

/**
 * Lógica para a habilidade Corrente Tóxica (Toxic Chain).
 * Regra Oficial: Quando o Pokémon atinge um oponente com um movimento, 
 * há 30% de chance de o alvo ficar gravemente envenenado (Toxic).
 */
export function handleToxicChain(attacker: Pokemon, defender: Pokemon, move: Move, logs: {message: string, color: string}[]) {
    // Só ativa se o atacante tiver a habilidade e for um movimento de dano (não status)
    if (attacker.ability !== 'toxic-chain' || defender.isFainted || move.damageClass === 'status') {
        return;
    }

    // 30% de chance de aplicar o status Tóxico
    if (Math.random() < 0.3) {
        // applyStatus já lida com imunidades (tipo Aço, Venenoso, etc) e se o alvo já tem status
        Effects.applyStatus(defender, 'toxic', logs as any, attacker);
    }
}
