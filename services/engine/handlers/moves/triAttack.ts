
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário do Tri-Ataque (Tri Attack).
 * Regra Oficial: Tem 20% de chance de causar efeito.
 * Se o efeito ativar, há 33.3% de chance para cada: Paralisia, Queimadura ou Congelamento.
 */
export function handleTriAttackEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    const rand = Math.random();
    let status = '';

    if (rand < 0.3333) {
        status = 'paralysis';
    } else if (rand < 0.6666) {
        status = 'burn';
    } else {
        status = 'freeze';
    }

    // A função applyStatus já cuida de imunidades de tipo (ex: Fogo imune a Burn) e habilidades
    StatusConditions.applyStatus(
        defender, 
        status, 
        logs as any, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}
