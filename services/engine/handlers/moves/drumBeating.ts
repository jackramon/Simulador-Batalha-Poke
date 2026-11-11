
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Batida de Tambor (Drum Beating).
 * Regra Oficial: Causa dano e reduz a Velocidade do alvo em 1 estágio (100% de chance).
 * Não é um movimento de contato.
 */
export function handleDrumBeatingEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);

    // Aplica redução de Velocidade (-1)
    // O parâmetro 'isOpponentSource' é true pois é um efeito causado pelo atacante no defensor.
    StatChanges.applyMoveStatChange(
        defender,
        'speed-down',
        logs,
        true, 
        ignoresAbilities,
        'drum-beating',
        state
    );
}
