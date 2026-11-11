
/**
 * Lógica para o movimento Golpe Falso (False Swipe).
 * Regra Oficial: O ataque não pode fazer o oponente desmaiar.
 * Se o dano calculado for maior ou igual ao HP atual do alvo, 
 * o dano é ajustado para deixar o alvo com 1 HP.
 */
export function limitDamage(calculatedDamage: number, currentHp: number): number {
    if (calculatedDamage >= currentHp) {
        return Math.max(0, currentHp - 1);
    }
    return calculatedDamage;
}
