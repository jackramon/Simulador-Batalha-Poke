
import { Pokemon, BattleState, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Handler para o movimento Stone Axe (Machado de Pedra).
 * 
 * Efeito:
 * - Causa dano.
 * - Coloca Stealth Rock (Pedras Ocultas) no campo do oponente.
 * - Alta chance de crítico (tratado em data/moves/effects/rock.ts).
 */
export function handleStoneAxeEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (!state) return;

    const targetSide = state.team1.some(p => p.id === defender.id) ? state.p1Hazards : state.p2Hazards;
    const targetSideName = state.team1.some(p => p.id === defender.id) ? "1" : "2"; // Simplificação, idealmente usar nomes dos jogadores

    if (targetSide.stealthRock) {
        // Já tem pedras, não faz nada (ou falha silenciosamente quanto ao efeito)
        return;
    }

    targetSide.stealthRock = true;
    log(logs, `Pedras pontiagudas flutuam no ar ao redor da equipe inimiga!`, 'text-slate-600 font-bold');
}
