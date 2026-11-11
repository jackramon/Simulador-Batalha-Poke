
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Titereiro Venenoso (Poison Puppeteer).
 * Regra Oficial: Quando o Pokémon com esta habilidade envenena um oponente, 
 * esse oponente também fica confuso.
 */
export function handlePoisonPuppeteer(
    attacker: Pokemon, 
    target: Pokemon, 
    status: string, 
    logs: {message: string, color: string}[],
    applyStatusFn: Function,
    state?: BattleState
) {
    if (attacker.ability === 'poison-puppeteer' && (status === 'poison' || status === 'toxic')) {
        // Se o alvo já estiver confuso ou desmaiado, não faz nada
        if (!target.statusEffects.confusion && !target.isFainted) {
            log(logs, `O Titereiro Venenoso de ${attacker.name} assumiu o controle de ${target.name}!`, 'text-purple-600 font-bold italic');
            
            // Chama a função de status para aplicar confusão
            // Passamos a função como argumento para evitar dependência circular direta entre os arquivos
            applyStatusFn(target, 'confusion', logs, attacker, false, state);
        }
    }
}
