
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o efeito de contato do Escudo de Espinhos (Spiky Shield).
 * Regra Oficial: Se o usuário for atingido por um movimento de contato enquanto protegido por Spiky Shield,
 * o atacante perde 1/8 do seu HP máximo.
 */
export function handleContact(
    defender: Pokemon, 
    attacker: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.statusEffects['spiky-shield']) {
        // Verifica Magic Guard (protege contra dano indireto)
        if (attacker.ability !== 'magic-guard') {
            const damage = Math.floor(attacker.maxHP / 8) || 1;
            attacker.hp = Math.max(0, attacker.hp - damage);
            
            log(logs, `${attacker.name} se machucou no Escudo de Espinhos! (-${damage})`, 'text-red-500 font-bold');
            
            if (attacker.hp === 0) {
                attacker.isFainted = true;
                log(logs, BATTLE_MESSAGES.FAINTED(attacker.name), 'text-red-900 font-bold');
            }
        }
    }
}
