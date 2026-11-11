
import { Pokemon } from '../../../../types';
import { getEffectiveSpeed } from '../../../battleUtils';

/**
 * Calcula o poder do Giro Bola (Gyro Ball).
 * Fórmula: 25 * (Velocidade do Alvo / Velocidade do Usuário) + 1
 * Poder Máximo: 150
 * Poder Mínimo: 1
 */
export function calculateGyroBallPower(attacker: Pokemon, defender: Pokemon, weather: string): number {
    const userSpeed = getEffectiveSpeed(attacker, weather) || 1;
    const targetSpeed = getEffectiveSpeed(defender, weather) || 1;

    // Evita divisão por zero e garante velocidade mínima de 1
    const finalUserSpeed = Math.max(1, userSpeed);
    
    // Fórmula Oficial (Gen 6+): (25 * TargetSpeed / UserSpeed) + 1
    // A divisão é inteira (floor)
    let power = Math.floor((25 * targetSpeed) / finalUserSpeed) + 1;
    
    return Math.min(150, power);
}

/**
 * Calcula o poder da Bola Elétrica (Electro Ball).
 * Baseado na razão Velocidade Usuário / Velocidade Alvo.
 */
export function calculateElectroBallPower(attacker: Pokemon, defender: Pokemon, weather: string): number {
    const userSpeed = getEffectiveSpeed(attacker, weather) || 1;
    const targetSpeed = getEffectiveSpeed(defender, weather) || 1;
    
    const ratio = userSpeed / Math.max(1, targetSpeed);

    if (ratio >= 4) return 150;
    if (ratio >= 3) return 120;
    if (ratio >= 2) return 80;
    if (ratio >= 1) return 60;
    return 40;
}
