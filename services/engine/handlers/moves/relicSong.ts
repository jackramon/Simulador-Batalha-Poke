
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a mudança de forma da Canção Antiga (Relic Song).
 * Regra Oficial: Se o usuário for Meloetta, muda de forma (Aria <-> Pirouette) após causar dano.
 */
export function handleFormChange(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    // Verifica se é Meloetta (pelo nome base, considerando sufixos)
    if (!pokemon.name.includes('Meloetta') || pokemon.isFainted) return;

    // Detecta a forma atual baseado no tipo secundário ou nome
    // Aria: Normal/Psychic | Pirouette: Normal/Fighting
    const isPirouette = pokemon.types.includes('fighting') || pokemon.name.includes('Pirouette');

    if (isPirouette) {
        // Volta para Forma Ária
        // Normal: 100 HP, 77 Atk, 77 Def, 128 SpA, 128 SpD, 90 Spe
        // Stats no simulador (Nível 50 approx): 2*Base + 5
        pokemon.name = 'Meloetta';
        pokemon.types = ['normal', 'psychic'];
        
        pokemon.attackStat = (77 * 2) + 5;
        pokemon.defenseStat = (77 * 2) + 5;
        pokemon.spAttackStat = (128 * 2) + 5;
        pokemon.spDefenseStat = (128 * 2) + 5;
        pokemon.speedStat = (90 * 2) + 5;

        // Sprite ID 648 (Aria Forme)
        pokemon.spriteUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/648.png";
        
        log(logs, `${pokemon.name} cantou a melodia antiga e transformou-se na Forma Ária!`, 'text-pink-500 font-bold italic');
    } else {
        // Muda para Forma Pirueta
        // Normal: 100 HP, 128 Atk, 90 Def, 77 SpA, 77 SpD, 128 Spe
        pokemon.name = 'Meloetta (Pirouette)';
        pokemon.types = ['normal', 'fighting'];
        
        pokemon.attackStat = (128 * 2) + 5;
        pokemon.defenseStat = (90 * 2) + 5;
        pokemon.spAttackStat = (77 * 2) + 5;
        pokemon.spDefenseStat = (77 * 2) + 5;
        pokemon.speedStat = (128 * 2) + 5;

        // Sprite ID 10018 (Pirouette Forme)
        pokemon.spriteUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10018.png";
        
        log(logs, `${pokemon.name} dançou ao ritmo antigo e transformou-se na Forma Pirueta!`, 'text-orange-600 font-bold italic');
    }
}
