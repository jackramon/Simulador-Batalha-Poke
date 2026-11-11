
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Rosnado (Growl).
 * Regra Oficial: Reduz o Ataque do alvo em 1 estágio.
 * Categoria: Status (Não causa dano).
 * Propriedade: Som (Sound-based) - Bloqueado por Soundproof.
 */
export function handleGrowl(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Hyper Cutter)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Ataque (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'growl',
        state
    );
}
