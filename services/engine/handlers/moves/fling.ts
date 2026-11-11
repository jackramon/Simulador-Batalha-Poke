
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatusConditions from '../effects/statusConditions';
import * as VolatileStatus from '../effects/volatileStatus';
import { ITEMS_DATA } from '../../../../data/items';

/**
 * Calcula o poder base do movimento Arremesso (Fling) com base no item.
 */
export function getFlingPower(item: string): number {
    if (item.includes('plate')) return 90;
    if (item.includes('memory')) return 50;
    if (item.endsWith('-berry')) return 10;

    switch (item) {
        case 'iron-ball': return 130;
        case 'hard-stone': return 100;
        case 'poison-barb': 
        case 'dragon-fang': 
            return 70;
        case 'sharp-beak':
        case 'mystic-water':
        case 'miracle-seed':
        case 'charcoal':
        case 'magnet':
        case 'never-melt-ice':
        case 'soft-sand':
        case 'black-glasses':
        case 'black-belt':
        case 'silk-scarf':
        case 'spell-tag':
        case 'silver-powder':
        case 'twisted-spoon':
        case 'metal-coat':
            return 30;
        case 'light-ball':
        case 'toxic-orb':
        case 'flame-orb':
        case 'kings-rock':
        case 'razor-fang':
        case 'white-herb':
        case 'mental-herb':
            return 30;
        case 'heat-rock':
        case 'damp-rock':
        case 'icy-rock':
        case 'smooth-rock':
        case 'eject-button':
            return 40;
        case 'big-root':
            return 10;
        // Default para a maioria dos itens competitivos
        case 'leftovers':
        case 'choice-band':
        case 'choice-specs':
        case 'choice-scarf':
        case 'life-orb':
        case 'expert-belt':
        case 'assault-vest':
        case 'heavy-duty-boots':
        case 'weakness-policy':
        case 'focus-sash':
        case 'rocky-helmet':
        case 'safety-goggles':
        case 'air-balloon':
        case 'red-card':
        case 'room-service':
        case 'bright-powder':
        case 'light-clay':
        case 'terrain-extender':
            return 30; // Valor genérico seguro
        default:
            return 30;
    }
}

/**
 * Aplica o efeito secundário do item arremessado no alvo.
 */
export function handleFlingEffect(
    attacker: Pokemon, 
    defender: Pokemon, 
    item: string, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    const itemName = ITEMS_DATA[item]?.name || item;

    // Efeitos de Status
    if (item === 'flame-orb') {
        StatusConditions.applyStatus(defender, 'burn', logs as any, attacker, false, state);
    } else if (item === 'toxic-orb') {
        StatusConditions.applyStatus(defender, 'toxic', logs as any, attacker, false, state);
    } else if (item === 'light-ball') {
        StatusConditions.applyStatus(defender, 'paralysis', logs as any, attacker, false, state);
    } else if (item === 'poison-barb') {
        StatusConditions.applyStatus(defender, 'poison', logs as any, attacker, false, state);
    } else if (item === 'kings-rock' || item === 'razor-fang') {
        VolatileStatus.handleFlinch(defender, logs, false); // Fling não ignora habilidades por padrão
    } else if (item === 'mental-herb') {
        if (defender.statusEffects.infatuation || defender.statusEffects.taunt || defender.statusEffects.torment || defender.statusEffects.encore || defender.statusEffects.disable) {
            delete defender.statusEffects.infatuation;
            delete defender.statusEffects.taunt;
            delete defender.statusEffects.torment;
            delete defender.statusEffects.encore;
            delete defender.statusEffects.disable; // Simplificação, na verdade remove o contador
            log(logs, `${defender.name} foi curado de condições mentais pela ${itemName}!`, 'text-blue-500 font-bold');
        }
    } else if (item === 'white-herb') {
        let restored = false;
        (Object.keys(defender.statStages) as (keyof typeof defender.statStages)[]).forEach(stat => {
            if (defender.statStages[stat] < 0) {
                defender.statStages[stat] = 0;
                restored = true;
            }
        });
        if (restored) {
            log(logs, `${defender.name} teve seus atributos negativos restaurados pela ${itemName}!`, 'text-green-500 font-bold');
        }
    } 
    
    // Efeitos de Berries (Ativam no ALVO)
    else if (item.endsWith('-berry')) {
        log(logs, `${defender.name} consumiu a ${itemName} arremessada!`, 'text-green-600 italic');
        
        if (item === 'lum-berry') {
            if (Object.keys(defender.statusEffects).length > 0) {
                defender.statusEffects = {};
                log(logs, `${defender.name} curou seus status!`, 'text-blue-500');
            }
        } else if (item === 'sitrus-berry') {
            const heal = Math.floor(defender.maxHP * 0.25);
            defender.hp = Math.min(defender.maxHP, defender.hp + heal);
            log(logs, `${defender.name} recuperou vida!`, 'text-green-500 font-bold');
        } else if (item === 'oran-berry') {
            defender.hp = Math.min(defender.maxHP, defender.hp + 10);
            log(logs, `${defender.name} recuperou 10 PV!`, 'text-green-500 font-bold');
        } else if (item === 'leppa-berry') {
            // Restaura 10 PP de um golpe (simplificado para o primeiro não cheio)
            const move = defender.moves.find(m => m.uses < m.maxUses);
            if (move) {
                move.uses = Math.min(move.maxUses, move.uses + 10);
                log(logs, `${defender.name} recuperou PP de ${move.displayName}!`, 'text-blue-500');
            }
        }
        // Pinch berries poderiam ser adicionadas aqui, mas Fling geralmente ativa independentemente do HP
        else if (['liechi-berry', 'ganlon-berry', 'petaya-berry', 'apicot-berry', 'salac-berry'].includes(item)) {
            const statMap: any = { 'liechi-berry': 'attack', 'ganlon-berry': 'defense', 'petaya-berry': 'spAttack', 'apicot-berry': 'spDefense', 'salac-berry': 'speed' };
            const stat = statMap[item];
            if (defender.statStages[stat] < 6) {
                defender.statStages[stat]++;
                log(logs, `O atributo de ${defender.name} aumentou!`, 'text-green-600');
            }
        }
    }
}
