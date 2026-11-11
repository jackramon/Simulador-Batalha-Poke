
import { Pokemon, LogEntry } from '../../../../types';
import * as VolatileStatus from '../effects/volatileStatus';

/**
 * Lógica para o efeito secundário da Cabeçada (Headbutt).
 * Regra Oficial: 30% de chance de fazer o alvo recuar (Flinch).
 */
export function handleHeadbuttEffect(
    defender: Pokemon,
    logs: LogEntry[],
    ignoresAbilities: boolean
) {
    // Aplica o efeito de recuo (Flinch)
    // O handler genérico lida com Inner Focus e outras imunidades
    VolatileStatus.handleFlinch(defender, logs, ignoresAbilities);
}
