
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Orgulho Próprio (Power Trip).
 * Regra Oficial: Poder base = 20 + (20 * Soma de todos os estágios positivos de atributos).
 * Atributos contados: Attack, Defense, Sp. Attack, Sp. Defense, Speed, Accuracy, Evasion.
 * Máximo Poder: 860 (igual a Stored Power).
 */
export function getPowerTripPower(attacker: Pokemon, basePower: number): { power: number, isBoosted: boolean, stageSum: number } {
    let stageSum = 0;
    const stages = attacker.statStages;

    // Itera sobre todos os atributos relevantes
    const statKeys = ['attack', 'defense', 'spAttack', 'spDefense', 'speed', 'accuracy', 'evasion'] as const;
    
    statKeys.forEach(key => {
        const stage = stages[key];
        if (stage > 0) {
            stageSum += stage;
        }
    });

    // 20 Base + 20 por estágio
    const power = 20 + (stageSum * 20);
    
    return { 
        power: power, 
        isBoosted: stageSum > 0,
        stageSum: stageSum
    };
}
