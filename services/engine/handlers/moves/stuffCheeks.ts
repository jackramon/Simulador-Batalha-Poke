
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as StatChanges from '../effects/statChanges';
import * as Unburden from '../abilities/unburden';
import * as CheekPouch from '../abilities/cheek_pouch';
import * as Ripen from '../abilities/ripen';
import * as CudChew from '../abilities/cud_chew';

export function handleStuffCheeks(attacker: Pokemon, logs: LogEntry[], state?: BattleState) {
    if (attacker.isFainted) return;

    const itemKey = attacker.heldItem;

    // Verifica se tem item e se é uma Berry
    if (!itemKey || !itemKey.endsWith('-berry')) {
        log(logs, `Mas falhou! ${attacker.name} não está segurando uma fruta.`, 'text-gray-500 italic');
        return;
    }

    const itemName = ITEMS_DATA[itemKey]?.name || itemKey;
    log(logs, `${attacker.name} encheu as bochechas com ${itemName}!`, 'text-green-700 font-bold');

    // 1. Aumenta Defesa em 2 estágios (Drasticamente)
    // O nome 'stuff-cheeks' está registrado em statChanges.ts para magnitude 2
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-up',
        logs,
        false,
        false,
        'stuff-cheeks',
        state
    );

    // 2. Consome a Fruta (Efeito)
    attacker.heldItem = null;
    attacker.consumedItem = itemKey;
    
    // Ripen Check
    const ripenMult = Ripen.getBerryMultiplier(attacker, state);

    // Efeitos específicos das frutas (Forced Consumption)
    
    // Healing Berries
    if (itemKey === 'sitrus-berry') {
        const healAmount = Math.floor(attacker.maxHP * 0.25 * ripenMult);
        attacker.hp = Math.min(attacker.maxHP, attacker.hp + healAmount);
        log(logs, `${attacker.name} recuperou vida!`, 'text-green-600 font-bold');
    }
    else if (['figy-berry', 'wiki-berry', 'mago-berry', 'aguav-berry', 'iapapa-berry'].includes(itemKey)) {
        const healAmount = Math.floor(attacker.maxHP * 0.33 * ripenMult);
        attacker.hp = Math.min(attacker.maxHP, attacker.hp + healAmount);
        log(logs, `${attacker.name} recuperou vida!`, 'text-green-600 font-bold');
    }
    else if (itemKey === 'oran-berry') {
        const healAmount = 10 * ripenMult;
        attacker.hp = Math.min(attacker.maxHP, attacker.hp + healAmount);
        log(logs, `${attacker.name} recuperou ${healAmount} PV!`, 'text-green-600 font-bold');
    }
    // Status Berries
    else if (itemKey === 'lum-berry') {
        const curableStatuses = ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze', 'confusion'];
        let cured = false;
        curableStatuses.forEach(s => {
            if (attacker.statusEffects[s]) {
                delete attacker.statusEffects[s];
                cured = true;
            }
        });
        if (cured) log(logs, `${attacker.name} curou seus status!`, 'text-blue-500 font-bold');
    }
    // Stat Berries
    else {
        const statMap: Record<string, string> = {
            'liechi-berry': 'attack-up',
            'ganlon-berry': 'defense-up',
            'petaya-berry': 'spAttack-up',
            'apicot-berry': 'spDefense-up',
            'salac-berry': 'speed-up',
            'micle-berry': 'accuracy-up', 
            'lansat-berry': 'critical-up' // Not fully implemented in applyMoveStatChange but kept for future
        };
        
        const statEffect = statMap[itemKey];
        if (statEffect && statEffect !== 'critical-up') {
            // Apply stat boost * ripenMult
            for(let i=0; i<ripenMult; i++) {
                StatChanges.applyMoveStatChange(attacker, statEffect, logs, false, false, undefined, state);
            }
        }
    }

    // 3. Triggers
    Unburden.triggerUnburden(attacker, logs);
    CheekPouch.handleCheekPouch(attacker, logs);
    CudChew.setupCudChew(attacker, itemKey, state);
}
