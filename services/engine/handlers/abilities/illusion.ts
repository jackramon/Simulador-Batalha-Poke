
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Ilusão (Illusion).
 * Regra Oficial: O Pokémon assume a aparência do último Pokémon saudável de sua equipe ao entrar.
 * O disfarce quebra ao receber dano de um movimento.
 */

export function applyIllusion(pokemon: Pokemon, team: Pokemon[], logs: {message: string, color: string}[]): boolean {
    if (pokemon.ability !== 'illusion' || pokemon.isFainted) return false;

    // Encontra o último Pokémon saudável da equipe que não seja o próprio Pokémon
    const potentialTargets = team.filter(p => p.id !== pokemon.id && !p.isFainted);
    
    if (potentialTargets.length === 0) return false;

    const target = potentialTargets[potentialTargets.length - 1];

    // Salva estado original
    pokemon.illusionData = {
        originalName: pokemon.name,
        originalSprite: pokemon.spriteUrl,
        originalGender: pokemon.gender
    };

    // Aplica disfarce
    pokemon.name = target.name;
    pokemon.spriteUrl = target.spriteUrl;
    pokemon.gender = target.gender;

    // Nota: A habilidade não é anunciada na entrada enquanto o disfarce está ativo.
    return true;
}

export function breakIllusion(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    if (!pokemon.illusionData) return false;

    // Restaura estado original
    pokemon.name = pokemon.illusionData.originalName;
    pokemon.spriteUrl = pokemon.illusionData.originalSprite;
    pokemon.gender = pokemon.illusionData.originalGender;
    
    delete pokemon.illusionData;

    log(logs, `A ilusão de ${pokemon.name} desapareceu!`, 'text-purple-600 font-bold italic');
    return true;
}

export function isUnderIllusion(pokemon: Pokemon): boolean {
    return !!pokemon.illusionData;
}
