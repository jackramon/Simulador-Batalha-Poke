
import { Move } from '../../../../types';

/**
 * Lógica para movimentos que sempre resultam em acerto crítico.
 * Exemplos: Bafo Gelado (Frost Breath), Arremesso Sísmico (Storm Throw), Truque Floral (Flower Trick).
 */

const GUARANTEED_CRIT_MOVES = [
    'frost-breath', 
    'storm-throw', 
    'wicked-blow', 
    'surging-strikes', 
    'flower-trick'
];

export function isCriticalGuaranteed(moveName: string): boolean {
    return GUARANTEED_CRIT_MOVES.includes(moveName);
}
