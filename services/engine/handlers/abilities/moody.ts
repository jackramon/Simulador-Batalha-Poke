
import { Pokemon, StatStages } from '../../../../types';
import { STAT_NAMES_PT } from '../../../../data/pokemon';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Instável (Moody).
 * Regra Oficial (Gen 8+): Ao final de cada turno, um atributo aleatório (Atk, Def, SpA, SpD, Spe)
 * aumenta em 2 estágios e outro atributo diferente cai 1 estágio.
 */
export function handleMoody(pokemon: Pokemon, logs: { message: string; color: string }[]) {
    if (pokemon.ability !== 'moody' || pokemon.isFainted) return;

    const stats: (keyof StatStages)[] = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];

    // 1. Seleciona o atributo para aumentar (+2)
    // Filtramos apenas os que não estão no máximo para garantir que algo aconteça, 
    // mas seguindo a risca, Moody pode selecionar um stat no +6 e falhar. 
    // Para melhor UX no simulador, focamos em stats que podem mudar.
    const boostable = stats.filter(s => pokemon.statStages[s] < 6);
    if (boostable.length === 0) return;

    const statToBoost = boostable[Math.floor(Math.random() * boostable.length)];

    // 2. Seleciona o atributo para reduzir (-1), garantindo que seja diferente do primeiro
    const lowerable = stats.filter(s => s !== statToBoost && pokemon.statStages[s] > -6);
    
    // Aplica o aumento
    applyStatChange(pokemon, statToBoost, 2, logs);

    // Aplica a redução se houver um stat válido
    if (lowerable.length > 0) {
        const statToLower = lowerable[Math.floor(Math.random() * lowerable.length)];
        applyStatChange(pokemon, statToLower, -1, logs);
    }
}

function applyStatChange(pokemon: Pokemon, stat: keyof StatStages, amount: number, logs: any[]) {
    const current = pokemon.statStages[stat];
    const next = Math.max(-6, Math.min(6, current + amount));
    const diff = next - current;

    if (diff === 0) return;

    pokemon.statStages[stat] = next;

    const statName = STAT_NAMES_PT[stat] || stat;
    const isBoost = diff > 0;
    const intensity = Math.abs(diff) >= 2 ? ' muito' : '';
    const color = isBoost ? 'text-green-600' : 'text-red-600';
    const action = isBoost ? 'aumentou' : 'reduziu';

    log(logs, `A habilidade Instável de ${pokemon.name} ${action}${intensity} seu ${statName}!`, color);
}
