
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';
import * as Hazards from '../hazards';

/**
 * Lógica para a habilidade Limpa-Telas (Screen Cleaner).
 * Regra Oficial: Ao entrar em batalha, remove Refletir, Tela de Luz e Véu Aurora de ambos os lados.
 */
export function handleScreenCleaner(
    pokemon: Pokemon,
    state: BattleState,
    logs: { message: string, color: string }[]
): boolean {
    if (pokemon.ability !== 'screen-cleaner' || pokemon.isFainted) {
        return false;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    const p1H = state.p1Hazards;
    const p2H = state.p2Hazards;

    // Verifica se existe alguma barreira para limpar (para logar)
    const hasScreens = p1H.reflect > 0 || p1H.lightScreen > 0 || p1H.auroraVeil > 0 ||
                       p2H.reflect > 0 || p2H.lightScreen > 0 || p2H.auroraVeil > 0;

    if (hasScreens) {
        // Limpa Lado 1
        Hazards.clearScreens(p1H);

        // Limpa Lado 2
        Hazards.clearScreens(p2H);

        log(logs, `O Limpa-Telas de ${pokemon.name} removeu todas as barreiras do campo!`, 'text-indigo-600 font-bold italic');
        return true;
    }

    return false;
}
