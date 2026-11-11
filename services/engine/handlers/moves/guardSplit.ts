
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { calculateStat } from '../statCalculator';
import { NATURES } from '../../../../data/natures';

/**
 * Obtém o valor bruto de um atributo (ignorando estágios).
 * Usado para calcular a média.
 */
function getUnmodifiedStat(pokemon: Pokemon, stat: 'defense' | 'spDefense'): number {
    return calculateStat(pokemon, stat, 'none', false, true);
}

/**
 * Define o novo valor base do atributo para que, ao aplicar a fórmula de stats,
 * o resultado final seja igual ao valor alvo (targetValue).
 * Isso simula a alteração permanente do atributo durante a batalha.
 */
function setBaseStat(pokemon: Pokemon, stat: 'defense' | 'spDefense', targetValue: number) {
    // Reverte a fórmula de stat para encontrar o novo Base Stat.
    // Fórmula Final: Val = Math.floor(((2 * Base + IV + EV/4) * Level / 100) + 5) * Nature
    
    // 1. Remove influência da Natureza
    let natureMult = 1.0;
    if (pokemon.nature && NATURES[pokemon.nature]) {
        const n = NATURES[pokemon.nature];
        if (n.plus === stat) natureMult = 1.1;
        if (n.minus === stat) natureMult = 0.9;
    }
    
    // Core + 5 = Val / Nature
    const corePlus5 = targetValue / natureMult;
    const core = corePlus5 - 5;
    
    // 2. Reverte a fórmula do Core
    // Core = ((2 * Base + IV + EV/4) * Level) / 100
    // (2 * Base + Constants) = (Core * 100) / Level
    // 2 * Base = ((Core * 100) / Level) - Constants
    
    const level = pokemon.level || 50;
    const iv = pokemon.ivs?.[stat] ?? 31;
    // O valor padrão de EVs no statCalculator é 85, precisamos alinhar aqui para a matemática bater
    const ev = pokemon.evs?.[stat] ?? 85; 
    const constants = iv + Math.floor(ev / 4);
    
    const doubleBase = ((core * 100) / level) - constants;
    const base = doubleBase / 2;
    
    // Garante que o base stat seja válido (mínimo 1)
    const finalBase = Math.max(1, Math.floor(base));
    
    // Atualiza a propriedade no objeto Pokémon
    if (stat === 'defense') pokemon.defenseStat = finalBase;
    if (stat === 'spDefense') pokemon.spDefenseStat = finalBase;
}

/**
 * Lógica para o movimento Divisão de Guarda (Guard Split).
 * Regra Oficial: Calcula a média da Defesa e Defesa Especial (valores brutos) 
 * do usuário e do alvo, e substitui os valores originais pela média.
 */
export function handleGuardSplit(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    if (defender.isFainted) return;

    // 1. Obtém os valores atuais (sem modifiers de estágio)
    const atkDef = getUnmodifiedStat(attacker, 'defense');
    const atkSpDef = getUnmodifiedStat(attacker, 'spDefense');
    const defDef = getUnmodifiedStat(defender, 'defense');
    const defSpDef = getUnmodifiedStat(defender, 'spDefense');

    // 2. Calcula as médias
    const avgDef = Math.floor((atkDef + defDef) / 2);
    const avgSpDef = Math.floor((atkSpDef + defSpDef) / 2);

    // 3. Aplica os novos valores alterando o Base Stat efetivo
    setBaseStat(attacker, 'defense', avgDef);
    setBaseStat(attacker, 'spDefense', avgSpDef);
    setBaseStat(defender, 'defense', avgDef);
    setBaseStat(defender, 'spDefense', avgSpDef);

    log(logs, `${attacker.name} dividiu sua guarda com o alvo!`, 'text-indigo-600 font-bold');
}
