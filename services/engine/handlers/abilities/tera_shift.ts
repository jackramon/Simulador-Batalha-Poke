
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Mudança Tera (Tera Shift).
 * Exclusiva de Terapagos.
 * Regra Oficial: Ao entrar em batalha, Terapagos muda de sua Forma Normal para sua Forma Terastal.
 */
export function handleTeraShift(pokemon: Pokemon, logs: { message: string, color: string }[]): boolean {
    if (pokemon.ability !== 'tera-shift' || pokemon.isFainted) {
        return false;
    }

    // Verifica se já está na forma Terastal para evitar re-gatilhos (mesmo que entry handles costumem rodar uma vez)
    if (pokemon.statusEffects['tera-shifted']) {
        return false;
    }

    log(logs, `A Mudança Tera de ${pokemon.name} está alterando sua forma!`, 'text-indigo-600 font-black italic text-lg');

    // 1. Marcação de estado transformado
    pokemon.statusEffects['tera-shifted'] = { turns: -1 };

    // 2. Atualização de Atributos Base (Terapagos-Terastal)
    // Normal: 90 HP, 65 Atk, 85 Def, 65 SpA, 85 SpD, 60 Spe
    // Terastal: 95 HP, 95 Atk, 110 Def, 105 SpA, 110 SpD, 85 Spe
    // Cálculo: (Base * 2) + 5
    
    pokemon.attackStat = (95 * 2) + 5;    // 195
    pokemon.defenseStat = (110 * 2) + 5;   // 225
    pokemon.spAttackStat = (105 * 2) + 5;  // 215
    pokemon.spDefenseStat = (110 * 2) + 5; // 225
    pokemon.speedStat = (85 * 2) + 5;      // 175
    
    // Nota: O HP máximo oficial muda levemente (90 para 95), mas mid-battle 
    // costuma-se manter o HP atual/máximo escalonado ou fixo para evitar bugs de desmaio.
    // Aqui mantemos a integridade do HP atual mas subimos o teto se necessário.
    const oldMax = pokemon.maxHP;
    pokemon.maxHP = (95 * 2) + 110; // 300
    if (pokemon.hp === oldMax) pokemon.hp = pokemon.maxHP;

    // 3. Atualização de Sprite (ID 10276 - Terapagos-Terastal)
    pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10276.png`;

    log(logs, `${pokemon.name} transformou-se em sua Forma Terastal!`, 'text-blue-500 font-bold');

    return true;
}
