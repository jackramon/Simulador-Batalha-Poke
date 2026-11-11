
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Tensão (Unnerve).
 * Regra Oficial: Impede que os oponentes usem frutas seguradas.
 * Também se aplica a Unidade (As One).
 */

const UNNERVE_ABILITIES = ['unnerve', 'as-one-spectrier', 'as-one-glastrier'];

/**
 * Verifica se o Pokémon atual está sob o efeito de Tensão (ou Unidade) de um oponente.
 */
export function isOpponentUnnerved(pokemon: Pokemon, state?: BattleState): boolean {
    if (!state) return false;

    // Identifica o oponente
    const isP1 = state.team1.some(p => p.id === pokemon.id);
    const opponent = isP1 ? state.currentPokemon2 : state.currentPokemon1;

    if (!opponent || opponent.isFainted) return false;

    // Verifica se o oponente tem Tensão ou Unidade
    if (UNNERVE_ABILITIES.includes(opponent.ability)) {
        // Verifica se a habilidade está suprimida
        // Nota: As One é imune a Neutralizing Gas, mas Unnerve puro não.
        // A função canAbilityTrigger já lida com a lista UNGASABLE_ABILITIES.
        if (NeutralizingGas.canAbilityTrigger(opponent, state)) {
            return true;
        }
    }

    return false;
}

/**
 * Exibe o anúncio de ativação da habilidade ao entrar em campo.
 */
export function announceUnnerve(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (UNNERVE_ABILITIES.includes(pokemon.ability) && !pokemon.isFainted) {
        log(logs, `${pokemon.name} está deixando os oponentes tensos demais para comer frutas!`, 'text-purple-700 font-bold italic');
    }
}
