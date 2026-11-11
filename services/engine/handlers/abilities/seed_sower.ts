
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Semeador (Seed Sower).
 * Regra Oficial: Quando o Pokémon é atingido por um ataque, ele invoca o Terreno de Grama.
 */
export function handleSeedSower(
    defender: Pokemon,
    state: BattleState,
    logs: { message: string, color: string }[]
): boolean {
    if (defender.ability !== 'seed-sower' || defender.isFainted) {
        return false;
    }

    // Ativa o terreno (mesmo se já houver um, ele é substituído/renovado pelo novo)
    state.terrain = 'grassy';
    state.terrainTurns = 5;

    // Se o Pokémon estiver segurando Terrain Extender (item futuro), a duração seria 8. 
    // Por enquanto, mantemos o padrão de 5 turnos.

    log(logs, `A habilidade Semeador de ${defender.name} fez brotar grama por todo o campo!`, 'text-green-600 font-bold italic');
    
    return true;
}
