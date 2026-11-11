
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Pele Áspera (Rough Skin) e Espinhos de Ferro (Iron Barbs).
 * O atacante recebe dano de 1/8 do seu HP máximo para cada acerto de contato.
 */
export function handleRoughSkin(
    attacker: Pokemon, 
    defender: Pokemon, 
    hitsLanded: number, 
    logs: {message: string, color: string}[]
): boolean {
    if (attacker.isFainted) return false;

    // Ambas as habilidades possuem o mesmo efeito mecânico
    const hasEffect = defender.ability === 'rough-skin' || defender.ability === 'iron-barbs';
    
    if (hasEffect && attacker.ability !== 'magic-guard') {
        const damagePerHit = Math.floor(attacker.maxHP / 8) || 1;
        const totalDamage = damagePerHit * hitsLanded;
        
        attacker.hp = Math.max(0, attacker.hp - totalDamage);
        
        const abilityName = defender.ability === 'rough-skin' ? 'Pele Áspera' : 'Espinhos de Ferro';
        log(logs, `${attacker.name} se machucou na ${abilityName} de ${defender.name}!`, 'text-red-600 font-bold');
        
        if (attacker.hp === 0) {
            attacker.isFainted = true;
        }
        return true;
    }
    
    return false;
}
