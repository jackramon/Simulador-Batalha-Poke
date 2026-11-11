
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

const STOCKPILE_KEY = 'stockpile';

/**
 * Verifica se o Cuspir (Spit Up) deve falhar.
 * Regra Oficial: Falha se o usuário não tiver acumulado energia com Stockpile (Estocagem).
 */
export function checkFailure(attacker: Pokemon, logs: LogEntry[]): boolean {
    const stockpile = attacker.statusEffects[STOCKPILE_KEY];
    
    if (!stockpile || !stockpile.damageAccumulated || stockpile.damageAccumulated <= 0) {
        log(logs, `Mas falhou! ${attacker.name} não estocou energia.`, 'text-gray-500 italic');
        return true;
    }
    return false;
}

/**
 * Calcula o poder do Cuspir.
 * Fórmula: 100 * Número de Estoques.
 * Máximo de 3 estoques = 300 poder base.
 */
export function getSpitUpPower(attacker: Pokemon): number {
    const stockpile = attacker.statusEffects[STOCKPILE_KEY];
    const stacks = stockpile?.damageAccumulated || 0;

    return 100 * stacks;
}

/**
 * Executa o efeito pós-dano do Cuspir.
 * Regra Oficial: 
 * 1. O contador de Stockpile é zerado.
 * 2. Os aumentos de Defesa e Defesa Especial obtidos pelo Stockpile são removidos.
 */
export function handleSpitUpEffect(attacker: Pokemon, logs: LogEntry[]) {
    const stockpile = attacker.statusEffects[STOCKPILE_KEY];
    if (!stockpile) return;

    const stacks = stockpile.damageAccumulated || 0;

    // Remove os buffs de Defesa
    if (attacker.statStages.defense > -6) {
        attacker.statStages.defense = Math.max(-6, attacker.statStages.defense - stacks);
    }
    
    // Remove os buffs de Defesa Especial
    if (attacker.statStages.spDefense > -6) {
        attacker.statStages.spDefense = Math.max(-6, attacker.statStages.spDefense - stacks);
    }

    // Remove o status Stockpile
    delete attacker.statusEffects[STOCKPILE_KEY];

    log(logs, `A energia estocada de ${attacker.name} foi liberada! Os atributos voltaram ao normal.`, 'text-orange-600 font-bold italic');
}
