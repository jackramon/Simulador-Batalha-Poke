
import { Move } from '../../../../types';

/**
 * Calcula o poder de Trump Card baseado no PP restante.
 * 
 * Tabela de Poder (Gen 5+):
 * PP restante (antes do uso):
 * 1 (último uso): 200
 * 2: 80
 * 3: 60
 * 4: 50
 * 5+: 40
 * 
 * @param move O movimento Trump Card sendo usado.
 */
export function getTrumpCardPower(move: Move): number {
    // O PP (uses) aqui reflete o valor ANTES de ser decrementado (ou o valor atual no momento da execução).
    // Assumindo que move.uses contém o PP disponível para este uso.
    
    const pp = move.uses;

    if (pp <= 1) return 200;
    if (pp === 2) return 80;
    if (pp === 3) return 60;
    if (pp === 4) return 50;
    
    return 40;
}
