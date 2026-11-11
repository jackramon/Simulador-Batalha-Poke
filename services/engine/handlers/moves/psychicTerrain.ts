
import { BattleState, LogEntry, Pokemon } from '../../../../types';
import { log } from '../../utils';

export function handlePsychicTerrain(state: BattleState, logs: LogEntry[], attacker: Pokemon) {
    if (state.terrain === 'psychic') {
        log(logs, `Mas falhou! O Terreno Psíquico já está ativo.`, 'text-gray-500 italic');
        return;
    }

    state.terrain = 'psychic';
    // Verifica se o usuário está segurando Extensor de Terreno
    state.terrainTurns = attacker.heldItem === 'terrain-extender' ? 8 : 5;

    log(logs, `O campo ficou estranho com a energia do Terreno Psíquico!`, 'text-purple-600 font-bold');
}
