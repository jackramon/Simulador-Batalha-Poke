
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário do movimento Ataque de Raios (Bolt Strike).
 * Regra Oficial: Tem 20% de chance de causar Paralisia no alvo.
 */
export function handleBoltStrikeEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Paralisia
    // O helper central StatusConditions.applyStatus já gerencia:
    // - Imunidade de Tipo (Elétrico não paralisa)
    // - Imunidade de Habilidade (Limber, Comatose, Shields Down, etc)
    // - Imunidade de Campo (Misty Terrain)
    // - Verificação se já possui status
    StatusConditions.applyStatus(
        defender, 
        'paralysis', 
        logs as any, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}
