
import { Pokemon } from '../../../../types';

/**
 * Retorna o tipo efetivo de Tempestade Estelar Tera (Tera Starstorm).
 * Regra Oficial: Se o usuário estiver Terastalizado e seu tipo Tera for Estelar (Stellar),
 * o movimento se torna do tipo Estelar. Caso contrário, permanece Normal.
 */
export function getTeraStarstormType(attacker: Pokemon): string {
    if (attacker.isTerastallized && attacker.teraType === 'stellar') {
        return 'stellar';
    }
    return 'normal';
}
