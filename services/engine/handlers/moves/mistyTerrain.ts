
import { BattleState, LogEntry, Pokemon } from '../../../../types';
import { log } from '../../utils';

export function handleMistyTerrain(state: BattleState, logs: LogEntry[], attacker: Pokemon) {
    if (state.terrain === 'misty') {
        log(logs, `Mas falhou! O Campo de Névoa já está ativo.`, 'text-gray-500 italic');
        return;
    }

    state.terrain = 'misty';
    // Verifica se o usuário está segurando Extensor de Terreno
    state.terrainTurns = attacker.heldItem === 'terrain-extender' ? 8 : 5;

    log(logs, `Uma névoa cobriu o campo de batalha!`, 'text-pink-500 font-bold');
}
