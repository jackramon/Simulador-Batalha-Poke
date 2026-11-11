
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Rugido Nobre (Noble Roar).
 * Regra Oficial: Reduz o Ataque e o Ataque Especial do alvo em 1 estágio.
 * É um movimento baseado em som (Sound-based), o que significa que é bloqueado 
 * pela habilidade Soundproof (gerenciado em mechanics/effectiveness.ts).
 */
export function handleNobleRoar(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Ataque (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'noble-roar',
        state
    );

    // Aplica redução de Ataque Especial (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'noble-roar',
        state
    );
}
