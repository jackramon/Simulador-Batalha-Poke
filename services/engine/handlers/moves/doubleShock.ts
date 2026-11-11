
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Choque Duplo (Double Shock).
 * Regras Oficiais:
 * 1. Falha se o usuário não tiver o tipo Elétrico.
 * 2. Se acertar, o usuário perde o tipo Elétrico (a menos que esteja Terastalizado).
 */

export function checkFailure(attacker: Pokemon, logs: {message: string, color: string}[]): boolean {
    // Verifica se o usuário possui o tipo Elétrico
    // Nota: Terastal Electric conta como tipo Elétrico para este check.
    const hasElectricType = attacker.isTerastallized 
        ? attacker.teraType === 'electric'
        : attacker.types.includes('electric');

    if (!hasElectricType) {
        log(logs, `Mas falhou! ${attacker.name} não é do tipo Elétrico!`, 'text-gray-500 italic');
        return true;
    }
    return false;
}

export function handleDoubleShockEffect(attacker: Pokemon, logs: {message: string, color: string}[]) {
    if (attacker.isFainted) return;

    // Se estiver Terastalizado, o movimento funciona (causa dano), mas o tipo não é removido.
    // O usuário não perde o tipo Tera.
    if (attacker.isTerastallized) {
        return;
    }

    // Remove o tipo Elétrico
    attacker.types = attacker.types.filter(t => t !== 'electric');
    
    // Se ficou sem tipos, torna-se "typeless" (array vazio, defensivamente neutro)
    log(logs, `${attacker.name} descarregou toda sua eletricidade e perdeu o tipo Elétrico!`, 'text-yellow-600 font-bold italic');
}
