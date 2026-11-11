
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Água Arrepiante (Chilling Water).
 * Regra Oficial: Causa dano e reduz o Ataque do alvo em 1 estágio (100% de chance).
 */
export function handleChillingWaterEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Hyper Cutter)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Ataque (-1)
    // O parâmetro 'isOpponentSource' é true pois é um efeito causado pelo atacante no defensor.
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, 
        ignoresAbilities,
        'chilling-water',
        state
    );
}
