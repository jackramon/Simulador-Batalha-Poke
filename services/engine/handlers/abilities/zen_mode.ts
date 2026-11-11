
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Modo Zen (Zen Mode).
 * Regra Oficial: Muda a forma do Pokémon no final do turno ou na entrada 
 * se o HP estiver em 50% ou menos.
 */
export function checkZenMode(pokemon: Pokemon, logs: { message: string, color: string }[]): boolean {
    if (pokemon.ability !== 'zen-mode' || pokemon.isFainted) return false;

    const threshold = pokemon.maxHP / 2;
    const isZen = pokemon.statusEffects['zen-mode-active'];
    const needsZen = pokemon.hp <= threshold;

    // Se já estiver na forma correta, não faz nada
    if ((isZen && needsZen) || (!isZen && !needsZen)) return false;

    // Identifica se é Darmanitan Padrão ou Galariano baseado nos tipos originais
    const isGalarian = pokemon.types.includes('ice') || pokemon.name.toLowerCase().includes('galar');

    if (needsZen) {
        // ATIVAÇÃO DO MODO ZEN
        pokemon.statusEffects['zen-mode-active'] = { turns: -1 };
        
        if (isGalarian) {
            // Galarian Darmanitan: Ice -> Ice/Fire
            // Stats: 105/140/55/30/55/95 -> 105/160/55/30/55/135
            pokemon.types = ['ice', 'fire'];
            pokemon.attackStat = 160;
            pokemon.speedStat = 135;
            pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10178.png`;
        } else {
            // Standard Darmanitan: Fire -> Fire/Psychic
            // Stats: 105/140/55/30/55/95 -> 105/30/105/140/105/55
            pokemon.types = ['fire', 'psychic'];
            pokemon.attackStat = 30;
            pokemon.defenseStat = 105;
            pokemon.spAttackStat = 140;
            pokemon.spDefenseStat = 105;
            pokemon.speedStat = 55;
            pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10017.png`;
        }
        log(logs, `${pokemon.name} entrou no Modo Zen!`, 'text-purple-600 font-bold italic');
    } else {
        // REVERSÃO PARA MODO NORMAL
        delete pokemon.statusEffects['zen-mode-active'];
        
        if (isGalarian) {
            pokemon.types = ['ice'];
            pokemon.attackStat = 140;
            pokemon.speedStat = 95;
            pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10177.png`;
        } else {
            pokemon.types = ['fire'];
            pokemon.attackStat = 140;
            pokemon.defenseStat = 55;
            pokemon.spAttackStat = 30;
            pokemon.spDefenseStat = 55;
            pokemon.speedStat = 95;
            pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/555.png`;
        }
        log(logs, `${pokemon.name} voltou ao normal.`, 'text-blue-500 italic');
    }

    return true;
}
