
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Olhos de Boneca (Baby-Doll Eyes).
 * Regra Oficial: Reduz o Ataque do alvo em 1 estágio.
 * Categoria: Status (Prioridade +1, tratada em data/moves/categories.ts).
 */
export function handleBabyDollEyes(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Ataque (-1)
    // O parâmetro 'isOpponentSource' é true pois é um efeito causado pelo atacante no defensor.
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'baby-doll-eyes',
        state
    );
}
