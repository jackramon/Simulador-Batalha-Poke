
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Confidência (Confide).
 * Regra Oficial: Reduz o Ataque Especial do alvo em 1 estágio.
 * Categoria: Status (Não causa dano).
 * Propriedade: Som (Sound-based) - Bloqueado por Soundproof, atravessa Substituto.
 */
export function handleConfide(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Ataque Especial (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'confide',
        state
    );
}
