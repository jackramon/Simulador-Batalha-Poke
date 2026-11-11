
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Comandante (Commander).
 * Regra Oficial: Quando este Pokémon entra em campo e há um Dondozo aliado, 
 * ele entra na boca do Dondozo e aumenta todos os atributos do aliado em 2 estágios.
 */
export function handleCommander(pokemon: Pokemon, state: BattleState, logs: { message: string, color: string }[]) {
    if (pokemon.ability !== 'commander' || pokemon.isFainted) return;

    // Em batalhas 1v1 oficiais, a habilidade não tem efeito. 
    // No entanto, implementamos a lógica para detectar o aliado para compatibilidade e modularidade.
    
    const isP1 = state.team1.some(p => p.id === pokemon.id);
    const ally = null; // Em 1v1 puro do simulador, o slot de aliado está vazio.

    // Se no futuro o motor suportar Double Battles, a lógica abaixo seria ativada:
    // if (ally && ally.name.toLowerCase().includes('dondozo') && !ally.isFainted) {
    //    applyCommanderBoost(ally, logs);
    //    pokemon.statusEffects['commander-active'] = { turns: -1 };
    // }
}

/**
 * Aplica o bônus drástico (+2 em tudo) ao Dondozo.
 */
export function applyCommanderBoost(dondozo: Pokemon, logs: { message: string, color: string }[]) {
    const stats = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const;
    let boosted = false;

    stats.forEach(stat => {
        if (dondozo.statStages[stat] < 6) {
            dondozo.statStages[stat] = Math.min(6, dondozo.statStages[stat] + 2);
            boosted = true;
        }
    });

    if (boosted) {
        log(logs, `O Comandante aumentou drasticamente todos os atributos de ${dondozo.name}!`, 'text-indigo-600 font-bold italic');
    }
}
