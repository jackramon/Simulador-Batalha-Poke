
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Banho de Veneno (Venom Drench).
 * Regra Oficial:
 * 1. Funciona apenas se o alvo estiver envenenado (Poison ou Toxic).
 * 2. Reduz o Ataque, Ataque Especial e Velocidade do alvo em 1 estágio.
 */
export function handleVenomDrench(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. Verifica se o alvo está envenenado
    const isPoisoned = defender.statusEffects.poison || defender.statusEffects.toxic;
    
    if (!isPoisoned) {
        log(logs, `Mas falhou! ${defender.name} não está envenenado.`, 'text-gray-500 italic');
        return;
    }

    // 2. Aplica as reduções de status
    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);
    
    // Reduz Ataque
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'venom-drench',
        state
    );

    // Reduz Ataque Especial
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true,
        ignoresAbilities,
        'venom-drench',
        state
    );

    // Reduz Velocidade
    StatChanges.applyMoveStatChange(
        defender,
        'speed-down',
        logs,
        true,
        ignoresAbilities,
        'venom-drench',
        state
    );
}
