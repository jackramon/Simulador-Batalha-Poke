
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Casca da Raiva (Anger Shell).
 * Regra Oficial: Quando o HP do Pokémon cai para metade ou menos, 
 * ele reduz suas defesas (Def e SpD) e aumenta seu poder ofensivo (Atk, SpA e Spe).
 */
export function handleAngerShell(pokemon: Pokemon, initialHp: number, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'anger-shell' || pokemon.isFainted) return;

    const threshold = pokemon.maxHP / 2;
    
    // Verifica se cruzou o limite de 50% de HP vindo de cima
    if (initialHp > threshold && pokemon.hp <= threshold) {
        log(logs, `${pokemon.name} ficou furioso e ativou sua Casca da Raiva!`, 'text-red-600 font-bold italic');

        // Aumenta atributos ofensivos (1 estágio cada)
        const statsToRaise = ['attack', 'spAttack', 'speed'] as const;
        statsToRaise.forEach(stat => {
            if (pokemon.statStages[stat] < 6) {
                pokemon.statStages[stat]++;
            }
        });

        // Reduz atributos defensivos (1 estágio cada)
        const statsToLower = ['defense', 'spDefense'] as const;
        statsToLower.forEach(stat => {
            if (pokemon.statStages[stat] > -6) {
                pokemon.statStages[stat]--;
            }
        });

        log(logs, `${pokemon.name} aumentou Ataque, Atq. Especial e Velocidade, mas sacrificou suas Defesas!`, 'text-orange-600');
    }
}
