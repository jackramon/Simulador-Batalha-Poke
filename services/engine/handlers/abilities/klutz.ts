
import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';
import { ITEMS_DATA, MEGA_STONES } from '../../../../data/items';

/**
 * Lógica para a habilidade Desajeitado (Klutz) e Status de Embargo.
 * Regra Oficial: O Pokémon é incapaz de usar itens segurados.
 * Retorna true se o item estiver suprimido.
 */
export function isItemSuppressed(pokemon: Pokemon, state?: BattleState): boolean {
    if (pokemon.isFainted || !pokemon.heldItem) return false;

    // 1. Verifica Embargo (Status)
    if (pokemon.statusEffects['embargo']) {
        return true;
    }

    // 2. Verifica Habilidade Klutz
    if (pokemon.ability === 'klutz') {
        // Se houver um estado de batalha, verifica se o Gás Neutralizante está anulando o Klutz
        if (state && !NeutralizingGas.canAbilityTrigger(pokemon, state)) {
            // Klutz está suprimido, então item funciona (retorna falso para isItemSuppressed)
        } else {
            return true;
        }
    }

    // 3. Magic Room (Sala Mágica)
    if (state?.magicRoomActive) {
        const item = pokemon.heldItem;

        // --- EXCEÇÕES DE MAGIC ROOM (Itens que mudam forma/mecanica crítica) ---
        
        // Mega Stones (Se compatível)
        // A lógica do sistema usa o sufixo no mapa MEGA_STONES para validar, 
        // mas aqui basta saber que é uma Mega Stone válida para a espécie. 
        // O mapa POKEMON_TO_MEGA_STONES seria ideal, mas MEGA_STONES já identifica o item como tal.
        if (MEGA_STONES[item]) return false;

        // Placas em Arceus
        if (item.endsWith('-plate') && pokemon.name.includes('Arceus')) return false;

        // Memórias em Silvally
        if (item.endsWith('-memory') && pokemon.name.includes('Silvally')) return false;

        // Griseous Orb em Giratina
        if (item === 'griseous-orb' && pokemon.name.includes('Giratina')) return false;

        // Rusted Sword/Shield em Zacian/Zamazenta
        if (item === 'rusted-sword' && pokemon.name.includes('Zacian')) return false;
        if (item === 'rusted-shield' && pokemon.name.includes('Zamazenta')) return false;

        // Se não for exceção, está suprimido
        return true;
    }

    return false;
}
