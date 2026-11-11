
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Soberano Supremo (Supreme Overlord).
 * Regra Oficial: Aumenta o poder dos movimentos em 10% por cada aliado derrotado na equipe.
 */

/**
 * Exibe o anúncio de ativação da habilidade ao entrar em campo se houver aliados derrotados.
 */
export function announceSupremeOverlord(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'supreme-overlord' || pokemon.isFainted) return;

    const team = state.team1.some(p => p.id === pokemon.id) ? state.team1 : state.team2;
    const faintedCount = team.filter(p => p.isFainted).length;

    if (faintedCount > 0) {
        log(logs, `${pokemon.name} ganhou força dos aliados caídos!`, 'text-indigo-700 font-bold italic');
    }
}

/**
 * Calcula o multiplicador de dano baseado no número de aliados desmaiados.
 */
export function getPowerMultiplier(pokemon: Pokemon, state?: BattleState): number {
    if (pokemon.ability !== 'supreme-overlord' || !state) return 1.0;

    const team = state.team1.some(p => p.id === pokemon.id) ? state.team1 : state.team2;
    const faintedCount = team.filter(p => p.isFainted).length;

    // 10% de bônus por aliado desmaiado (1.1x, 1.2x, etc.)
    return 1.0 + (faintedCount * 0.1);
}
