
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Entranhas de Fora (Innards Out).
 * Quando nocauteado, causa dano ao atacante igual ao HP que tinha antes do golpe fatal.
 */
export function handleInnardsOut(attacker: Pokemon, defender: Pokemon, prevHp: number, logs: {message: string, color: string}[]) {
    if (defender.ability !== 'innards-out' || attacker.isFainted) return;

    if (attacker.ability !== 'magic-guard') {
        const damage = prevHp;
        attacker.hp = Math.max(0, attacker.hp - damage);
        log(logs, `As Entranhas de Fora de ${defender.name} feriram ${attacker.name}!`, 'text-red-600 font-bold');
        
        if (attacker.hp === 0) {
            attacker.isFainted = true;
        }
    }
}
