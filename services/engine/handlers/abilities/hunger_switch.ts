
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Troca Voraz (Hunger Switch).
 * Regra Oficial: Alterna entre Modo Barriga Cheia e Modo Faminto ao final de cada turno.
 * O golpe Aura Wheel muda de tipo baseado na forma.
 */

export function handleHungerSwitch(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'hunger-switch' || pokemon.isFainted) return;

    const isHangry = !!pokemon.statusEffects['hangry-mode'];

    if (!isHangry) {
        // Muda para o Modo Faminto (Hangry Mode)
        // ID Oficial PokeAPI: 10173
        pokemon.statusEffects['hangry-mode'] = { turns: -1 };
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10173.png`;
        pokemon.name = 'Morpeko Barriga Vazia';
        log(logs, `${pokemon.name} ficou faminto e mudou para o Modo Faminto!`, 'text-purple-600 font-bold italic');
    } else {
        // Volta para o Modo Barriga Cheia (Full Belly)
        // ID Oficial PokeAPI: 877
        delete pokemon.statusEffects['hangry-mode'];
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/877.png`;
        pokemon.name = 'Morpeko Barriga Cheia';
        log(logs, `${pokemon.name} está de barriga cheia e voltou ao normal!`, 'text-yellow-600 font-bold italic');
    }
}

/**
 * Retorna o tipo efetivo do golpe Aura Wheel baseado no estado do portador.
 */
export function getAuraWheelType(pokemon: Pokemon, move: Move): string {
    if (move.name === 'aura-wheel' && pokemon.ability === 'hunger-switch') {
        return pokemon.statusEffects['hangry-mode'] ? 'dark' : 'electric';
    }
    return move.type;
}
