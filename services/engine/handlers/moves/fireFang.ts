
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';
import * as VolatileStatus from '../effects/volatileStatus';

/**
 * Lógica para o movimento Presa de Fogo (Fire Fang).
 * Regra Oficial:
 * 1. 10% de chance de causar Queimadura (Burn).
 * 2. 10% de chance de fazer o alvo recuar (Flinch).
 * As chances são independentes (podem ocorrer ambas).
 */
export function handleFireFangEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState,
    ignoresAbilities: boolean = false
) {
    if (defender.isFainted) return;

    const sereneMult = attacker.ability === 'serene-grace' ? 2 : 1;

    // Rolagem para Queimadura (Burn) - 10% base
    if (Math.random() < 0.1 * sereneMult) {
        StatusConditions.applyStatus(
            defender, 
            'burn', 
            logs as any, 
            attacker, 
            false, 
            state
        );
    }

    // Rolagem para Recuo (Flinch) - 10% base
    if (Math.random() < 0.1 * sereneMult) {
        VolatileStatus.handleFlinch(defender, logs, ignoresAbilities);
    }
}
