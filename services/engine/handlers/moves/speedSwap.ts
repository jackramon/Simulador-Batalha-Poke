
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { calculateStat } from '../statCalculator';
import { NATURES } from '../../../../data/natures';

/**
 * Obtém o valor bruto de Velocidade (ignorando estágios).
 */
function getUnmodifiedSpeed(pokemon: Pokemon): number {
    // ignoreStages = true
    return calculateStat(pokemon, 'speed', 'none', false, true);
}

/**
 * Define o novo valor base de Velocidade para que o resultado final corresponda ao alvo.
 */
function setBaseSpeed(pokemon: Pokemon, targetValue: number) {
    // Reverte a fórmula de stat para encontrar o novo Base Stat.
    
    // 1. Remove influência da Natureza
    let natureMult = 1.0;
    if (pokemon.nature && NATURES[pokemon.nature]) {
        const n = NATURES[pokemon.nature];
        if (n.plus === 'speed') natureMult = 1.1;
        if (n.minus === 'speed') natureMult = 0.9;
    }
    
    const corePlus5 = targetValue / natureMult;
    const core = corePlus5 - 5;
    
    // 2. Reverte a fórmula do Core
    const level = pokemon.level || 50;
    const iv = pokemon.ivs?.speed ?? 31;
    // O valor padrão de EVs no statCalculator é 85
    const ev = pokemon.evs ? pokemon.evs.speed : 85; 
    const constants = iv + Math.floor(ev / 4);
    
    const doubleBase = ((core * 100) / level) - constants;
    const base = doubleBase / 2;
    
    // Garante que o base stat seja válido (mínimo 1)
    const finalBase = Math.max(1, Math.floor(base));
    
    pokemon.speedStat = finalBase;
}

/**
 * Lógica para o movimento Troca de Velocidade (Speed Swap).
 * Regra Oficial: O usuário troca sua Velocidade bruta com o alvo.
 */
export function handleSpeedSwap(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    if (defender.isFainted) return;

    // 1. Obtém os valores atuais (sem modifiers de estágio)
    const atkSpeed = getUnmodifiedSpeed(attacker);
    const defSpeed = getUnmodifiedSpeed(defender);

    // 2. Troca os valores base efetivos
    setBaseSpeed(attacker, defSpeed);
    setBaseSpeed(defender, atkSpeed);

    log(logs, `${attacker.name} trocou sua Velocidade com o alvo!`, 'text-indigo-600 font-bold');
}
