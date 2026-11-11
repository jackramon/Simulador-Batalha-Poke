
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { TYPE_NAMES_PT } from '../../../../data/types';

/**
 * Lógica para a habilidade Sistema RKS (RKS System).
 * Exclusiva de Silvally.
 * Regra Oficial: Muda o tipo do Pokémon dependendo da Memória segurada.
 * IDs de Sprite oficiais da PokeAPI (Formas 10118 a 10134).
 */

const MEMORY_MAP: Record<string, { type: string, suffix: string }> = {
    'fighting-memory': { type: 'fighting', suffix: 'fighting' },
    'flying-memory': { type: 'flying', suffix: 'flying' },
    'poison-memory': { type: 'poison', suffix: 'poison' },
    'ground-memory': { type: 'ground', suffix: 'ground' },
    'rock-memory': { type: 'rock', suffix: 'rock' },
    'bug-memory': { type: 'bug', suffix: 'bug' },
    'ghost-memory': { type: 'ghost', suffix: 'ghost' },
    'steel-memory': { type: 'steel', suffix: 'steel' },
    'fire-memory': { type: 'fire', suffix: 'fire' },
    'water-memory': { type: 'water', suffix: 'water' },
    'grass-memory': { type: 'grass', suffix: 'grass' },
    'electric-memory': { type: 'electric', suffix: 'electric' },
    'psychic-memory': { type: 'psychic', suffix: 'psychic' },
    'ice-memory': { type: 'ice', suffix: 'ice' },
    'dragon-memory': { type: 'dragon', suffix: 'dragon' },
    'dark-memory': { type: 'dark', suffix: 'dark' },
    'fairy-memory': { type: 'fairy', suffix: 'fairy' },
};

export function handleRKSSystem(pokemon: Pokemon, logs: { message: string, color: string }[]): boolean {
    if (pokemon.ability !== 'rks-system' || pokemon.isFainted) {
        return false;
    }

    const item = pokemon.heldItem || '';
    const memoryData = MEMORY_MAP[item];

    if (memoryData) {
        const newType = memoryData.type;
        
        // Verifica se já está com o tipo correto para evitar logs redundantes
        // Nota: A atualização do sprite é forçada mesmo que o tipo já esteja certo,
        // para corrigir casos de sprites errados (ex: bug visual anterior).
        const typeChanged = !(pokemon.types.length === 1 && pokemon.types[0] === newType);

        pokemon.types = [newType];
        
        // Atualiza Sprite (Forms do Silvally usam o sufixo do tipo)
        const suffix = memoryData.suffix;
        
        // Mantém a arte oficial base (pois não há arte oficial por tipo no PokeAPI), ou usa a do Pokémon HOME se preferir.
        // Vamos usar a arte oficial base para o card, pois a anterior (10128) era o Lurantis Totem.
        pokemon.spriteUrl = pokemon.isShiny 
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/773.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png`;
            
        // Atualiza os sprites de batalha (pixel art)
        pokemon.backSpriteUrl = pokemon.isShiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/773-${suffix}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/773-${suffix}.png`;
            
        pokemon.pixelSpriteUrl = pokemon.isShiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/773-${suffix}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773-${suffix}.png`;

        if (typeChanged) {
            const typeName = TYPE_NAMES_PT[newType] || newType;
            log(logs, `O Sistema RKS de ${pokemon.name} alterou seu tipo para ${typeName}!`, 'text-indigo-600 font-bold italic');
        }
        return true;
    } else {
        // Sem memória válida: Volta ao tipo Normal
        if (pokemon.types.length === 1 && pokemon.types[0] === 'normal') {
            return false;
        }
        pokemon.types = ['normal'];
        
        // Sprites base do Silvally (ID 773)
        pokemon.spriteUrl = pokemon.isShiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/773.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png`;
            
        pokemon.backSpriteUrl = pokemon.isShiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/773.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/773.png`;
            
        pokemon.pixelSpriteUrl = pokemon.isShiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/773.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773.png`;
            
        return true;
    }
}
