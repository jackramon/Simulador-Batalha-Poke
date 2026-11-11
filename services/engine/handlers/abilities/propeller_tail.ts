
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Cauda de Hélice (Propeller Tail) e Mandíbula Robusta (Stalwart).
 * Ignora efeitos de redirecionamento de golpes (Siga-me, etc) e habilidades que atraem ataques.
 */
export function ignoresRedirection(pokemon: Pokemon): boolean {
    if (!pokemon || pokemon.isFainted) return false;
    const redirectionAbilities = ['propeller-tail', 'stalwart'];
    return redirectionAbilities.includes(pokemon.ability);
}

/**
 * Verifica se a habilidade do defensor é uma que "atrai" ou redireciona movimentos.
 * Exemplos: Storm Drain (Água) e Lightning Rod (Elétrico).
 */
export function isRedirectionAbility(ability: string, moveType: string): boolean {
    if (ability === 'storm-drain' && moveType === 'water') return true;
    if (ability === 'lightning-rod' && moveType === 'electric') return true;
    return false;
}

export function logRedirectionIgnored(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    log(logs, `${pokemon.name} ignorou o redirecionamento com sua habilidade!`, 'text-indigo-500 italic');
}
