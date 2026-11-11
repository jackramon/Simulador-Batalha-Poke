
import { Pokemon } from '../../../../types';
import * as VolatileStatus from '../effects/volatileStatus';

/**
 * Lógica para o efeito secundário da Lâmina de Ar (Air Slash).
 * Regra Oficial: Tem 30% de chance de fazer o alvo recuar (Flinch).
 */
export function handleAirSlashEffect(
    defender: Pokemon,
    logs: {message: string, color: string}[],
    ignoresAbilities: boolean
) {
    // Aplica o efeito de recuo (Flinch)
    // O handler genérico lida com Inner Focus e outras imunidades
    VolatileStatus.handleFlinch(defender, logs, ignoresAbilities);
}
