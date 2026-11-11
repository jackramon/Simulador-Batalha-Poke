
import { BattleState } from '../../../../types';
import * as SteelRoller from './steelRoller';

/**
 * Lógica para o movimento Pião de Gelo (Ice Spinner).
 * Regra Oficial: Remove qualquer terreno ativo no campo após causar dano.
 */
export function handleIceSpinnerEffect(state: BattleState, logs: {message: string, color: string}[]) {
    // Reutiliza a lógica de remoção de terreno já implementada
    SteelRoller.handleTerrainRemoval(state, logs);
}
