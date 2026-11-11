
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Bolsa na Bochecha (Cheek Pouch).
 * Regra Oficial: Restaura 1/3 do HP máximo do Pokémon quando ele consome uma Berry.
 */
export function handleCheekPouch(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability === 'cheek-pouch' && !pokemon.isFainted) {
        const healAmount = Math.floor(pokemon.maxHP / 3);
        const prevHp = pokemon.hp;
        pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
        
        const actualHealed = pokemon.hp - prevHp;
        if (actualHealed > 0) {
            log(logs, `${pokemon.name} recuperou HP extra com sua Bolsa na Bochecha!`, 'text-green-600 font-bold italic');
        }
    }
}
