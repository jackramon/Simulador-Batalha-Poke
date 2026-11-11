import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Do Zero ao Herói (Zero to Hero).
 * Regra Oficial: Quando um Pokémon com esta habilidade sai de campo, 
 * ele assume a forma Herói na próxima vez que entrar na batalha.
 */

/**
 * Registra que o Pokémon saiu de campo e está pronto para transformar.
 * Chamado durante o performSwitch para o Pokémon que sai.
 */
export function handleSwitchOut(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability === 'zero-to-hero' && !pokemon.statusEffects['zero-to-hero-transformed']) {
        pokemon.statusEffects['zero-to-hero-activated'] = { turns: -1 };
        // Nota: O log geralmente não aparece na saída nos jogos, apenas a transformação na volta.
    }
}

/**
 * Verifica e aplica a transformação na entrada em campo.
 */
export function checkTransformation(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    if (pokemon.ability !== 'zero-to-hero' || pokemon.isFainted) return false;

    // Só transforma se já tiver saído uma vez e ainda não estiver transformado
    if (pokemon.statusEffects['zero-to-hero-activated'] && !pokemon.statusEffects['zero-to-hero-transformed']) {
        
        // Marca como permanentemente transformado nesta batalha
        pokemon.statusEffects['zero-to-hero-transformed'] = { turns: -1 };
        delete pokemon.statusEffects['zero-to-hero-activated'];

        // Atualização de Atributos Base (Stats de Palafin-Hero)
        // Zero: HP 100, Atk 70, Def 72, SpA 53, SpD 62, Spe 100
        // Hero: HP 100, Atk 160, Def 106, SpA 106, SpD 87, Spe 100
        
        // Conversão para valores reais do simulador: (Base * 2) + 5
        pokemon.attackStat = (160 * 2) + 5;    // 325
        pokemon.defenseStat = (106 * 2) + 5;   // 217
        pokemon.spAttackStat = (106 * 2) + 5;  // 217
        pokemon.spDefenseStat = (87 * 2) + 5;  // 179
        // Velocidade base 100 mantém 205.

        // Mudança Visual para Palafin-Hero (ID 10256 no PokeAPI)
        const heroId = 10256;
        if (pokemon.isShiny) {
            pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${heroId}.png`;
            pokemon.pixelSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${heroId}.png`;
            pokemon.backSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${heroId}.png`;
        } else {
            pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${heroId}.png`;
            pokemon.pixelSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${heroId}.png`;
            pokemon.backSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${heroId}.png`;
        }

        log(logs, `${pokemon.name} transformou-se em sua Forma Herói!`, 'text-blue-600 font-black italic text-lg');
        return true;
    }

    return false;
}