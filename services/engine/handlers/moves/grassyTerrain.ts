
import { BattleState, LogEntry, Pokemon } from '../../../../types';
import { log } from '../../utils';

export function handleGrassyTerrain(state: BattleState, logs: LogEntry[], attacker: Pokemon) {
    if (state.terrain === 'grassy') {
        log(logs, `Mas falhou! O Terreno de Grama já está ativo.`, 'text-gray-500 italic');
        return;
    }

    state.terrain = 'grassy';
    // Verifica se o usuário está segurando Extensor de Terreno
    state.terrainTurns = attacker.heldItem === 'terrain-extender' ? 8 : 5;

    log(logs, `A grama alta brotou por todo o campo!`, 'text-green-600 font-bold');
}
