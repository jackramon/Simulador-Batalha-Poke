
import { BattleState, LogEntry, Pokemon } from '../../../../types';
import { log } from '../../utils';

export function handleElectricTerrain(state: BattleState, logs: LogEntry[], attacker: Pokemon) {
    if (state.terrain === 'electric') {
        log(logs, `Mas falhou! O Campo Elétrico já está ativo.`, 'text-gray-500 italic');
        return;
    }

    state.terrain = 'electric';
    // Verifica se o usuário está segurando Extensor de Terreno
    state.terrainTurns = attacker.heldItem === 'terrain-extender' ? 8 : 5;

    log(logs, `Um campo elétrico cobriu o campo de batalha!`, 'text-yellow-500 font-bold');
}
