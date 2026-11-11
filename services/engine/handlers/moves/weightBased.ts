
import { Pokemon } from '../../../../types';
import * as HeavyMetal from '../abilities/heavy_metal';

/**
 * Calcula o poder base para movimentos baseados no peso do alvo (Nó de Grama, Chute Baixo).
 * Regra Oficial (Gen 3+):
 * Peso (kg)      | Poder
 * -----------------------
 * 0.1 - 9.9 kg   | 20
 * 10.0 - 24.9 kg | 40
 * 25.0 - 49.9 kg | 60
 * 50.0 - 99.9 kg | 80
 * 100.0 - 199.9kg| 100
 * >= 200.0 kg    | 120
 */
export function getWeightTargetPower(defender: Pokemon): number {
    const targetWeight = HeavyMetal.getEffectiveWeight(defender); // Peso em hectogramas (1 hg = 0.1 kg)
    const weightKg = targetWeight / 10;

    if (weightKg >= 200) return 120;
    if (weightKg >= 100) return 100;
    if (weightKg >= 50) return 80;
    if (weightKg >= 25) return 60;
    if (weightKg >= 10) return 40;
    return 20;
}

/**
 * Calcula o poder base para movimentos baseados na razão de peso entre atacante e alvo (Pancada Pesada, Colisão de Calor).
 */
export function getWeightRatioPower(attacker: Pokemon, defender: Pokemon): number {
    const userWeight = HeavyMetal.getEffectiveWeight(attacker);
    const targetWeight = HeavyMetal.getEffectiveWeight(defender);
    const ratio = userWeight / targetWeight;

    if (ratio >= 5) return 120;
    if (ratio >= 4) return 100;
    if (ratio >= 3) return 80;
    if (ratio >= 2) return 60;
    return 40;
}

/**
 * Verifica se um movimento deve usar lógica de peso.
 */
export function calculateWeightPower(moveName: string, attacker: Pokemon, defender: Pokemon): number {
    if (moveName === 'grass-knot' || moveName === 'low-kick') {
        return getWeightTargetPower(defender);
    }
    if (moveName === 'heavy-slam' || moveName === 'heat-crash') {
        return getWeightRatioPower(attacker, defender);
    }
    return 0;
}
