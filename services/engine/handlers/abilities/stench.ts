
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';
import * as InnerFocus from './inner_focus';

/**
 * Lógica para a habilidade Mau Cheiro (Stench).
 * Regra Oficial: Movimentos de dano que não possuem chance de recuo ganham 10% de chance de causar flinch.
 * Não acumula com King's Rock/Razor Fang e não é afetado por Serene Grace.
 */
export function handleStench(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    logs: {message: string, color: string}[], 
    isGasActive: boolean, 
    ignoresAbilities: boolean
) {
    // 1. Verificações básicas de ativação
    if (attacker.ability !== 'stench' || isGasActive || move.damageClass === 'status' || defender.isFainted) {
        return;
    }

    // 2. Só aplica se o golpe NÃO possuir chance de recuo natural (Regra Oficial)
    if (move.effect?.status === 'flinch') {
        return;
    }

    // 3. 10% de chance fixa (não afetada por Serene Grace)
    if (Math.random() < 0.1) {
        // Verifica imunidade a flinch (Inner Focus), a menos que o atacante quebre o molde
        if (!InnerFocus.isImmuneToFlinch(defender) || ignoresAbilities) {
            defender.isFlinched = true;
            log(logs, `O Mau Cheiro de ${attacker.name} fez ${defender.name} recuar!`, 'text-gray-500 italic text-[10px]');
        }
    }
}
