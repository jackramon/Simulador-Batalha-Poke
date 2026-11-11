
import { Pokemon, BattleState, Move, LogEntry } from '../../../../types';
import { STATUS_TRANSLATIONS } from '../../../../data/translations';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { checkConsumableItems } from '../../../handlers/items';
import { SOUND_MOVES } from '../../../../data/moves/categories';

import * as Limber from '../abilities/limber';
import * as Insomnia from '../abilities/insomnia';
import * as VitalSpirit from '../abilities/vital_spirit';
import * as Immunity from '../abilities/immunity';
import * as MoldBreaker from '../abilities/mold_breaker';
import * as ThermalExchange from '../abilities/thermal_exchange';
import * as WaterVeil from '../abilities/water_veil';
import * as Comatose from '../abilities/comatose';
import * as Terrain from '../terrain';
import * as Infiltrator from '../abilities/infiltrator';
import * as Oblivious from '../abilities/oblivious';
import * as OwnTempo from '../abilities/own_tempo';
import * as AromaVeil from '../abilities/aroma_veil';
import * as FlowerVeil from '../abilities/flower_veil';
import * as SweetVeil from '../abilities/sweet_veil';
import * as MagmaArmor from '../abilities/magma_armor';
import * as LeafGuard from '../abilities/leaf_guard';
import * as PurifyingSalt from '../abilities/purifying_salt';
import * as Uproar from '../moves/uproar';
import * as PoisonPuppeteer from '../abilities/poison_puppeteer';

export const applyStatus = (
    target: Pokemon, 
    status: string, 
    logs: LogEntry[], 
    attacker?: Pokemon, 
    isFromSynchronize: boolean = false, 
    state?: BattleState,
    move?: Move // Adicionado parâmetro opcional para identificar se é movimento de som
) => {
    // FIX: Previne definitivamente que efeitos exclusivos do atacante ou mecânicas de engine sejam aplicados como status
    const selfEffects = ['recoil', 'recoil-half', 'crash-damage', 'self-faint', 'heal', 'charge', 'high-crit', 'priority', 'sound', 'ohko', 'ignores-abilities', 'always-crit', 'speed-based', 'remove-terrain', 'random-stat-up', 'give-item', 'reflect-type', 'bug-bite-effect', 'defog', 'dragon-ascent-drop', 'grounded', 'all-stats-up', 'rollout-lock', 'stealth-rock'];
    if (selfEffects.includes(status)) return;

    const majorStatus = ['burn', 'poison', 'toxic', 'paralysis', 'sleep', 'freeze', 'frostbite'];
    if (majorStatus.includes(status)) {
        const hasMajorStatus = majorStatus.some(s => target.statusEffects[s]);
        if (hasMajorStatus) return;
    }

    if (!target.statusEffects[status] && !target.isFainted) {
        const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker?.ability);
        const grounded = Terrain.isGrounded(target);
        
        // Verifica se o atacante tem a habilidade Infiltrator
        const canInfiltrate = attacker && Infiltrator.canInfiltrate(attacker, state);
        
        if (state) {
            const sideHazards = target === state.currentPokemon1 ? state.p1Hazards : state.p2Hazards;
            
            // Salvaguarda bloqueia status, a menos que o atacante tenha Infiltrator ou seja Sincronia
            if (sideHazards.safeguard > 0 && !canInfiltrate && !isFromSynchronize) {
                log(logs, `A Salvaguarda protege ${target.name}!`, 'text-blue-400 italic text-xs');
                return;
            }
        }

        // Verifica Substituto
        // Movimentos de Som atravessam Substituto
        const isSoundMove = move && SOUND_MOVES.includes(move.name);
        
        if (target.statusEffects['substitute'] && !canInfiltrate && !isSoundMove) {
            log(logs, BATTLE_MESSAGES.SUBSTITUTE_BLOCK(target.name), 'text-gray-500 italic text-xs');
            return;
        }

        if (status === 'sleep') {
            if (state && Uproar.isUproarActive(state)) {
                log(logs, BATTLE_MESSAGES.UPROAR_BLOCK(), 'text-red-500 italic');
                return;
            }
            if (grounded && state && state.terrain === 'electric') {
                log(logs, `${target.name} está cercado de eletricidade e não consegue dormir!`, 'text-yellow-600 italic');
                return;
            }
        }

        if (grounded && state && state.terrain !== 'none') {
            if (state.terrain === 'misty') {
                log(logs, `A névoa mística protege ${target.name} de condições de status!`, 'text-pink-600 italic');
                return;
            }
        }

        if (Comatose.isImmuneToStatus(target)) return;

        if (!ignoresAbilities) {
            if (PurifyingSalt.isImmuneToStatus(target, state)) return;
            if (target.ability === 'shields-down' && target.hp > target.maxHP * 0.5) return;
            if (status === 'paralysis' && Limber.isImmuneToParalysis(target)) return;
            if (status === 'sleep' && (VitalSpirit.isImmuneToSleep(target) || Insomnia.isImmuneToSleep(target) || SweetVeil.isImmuneToSleep(target, state))) return;
            if (status === 'burn' && (WaterVeil.isImmuneToBurn(target) || target.ability === 'water-bubble' || ThermalExchange.isImmuneToBurn(target))) return;
            if (status === 'freeze' && MagmaArmor.isImmuneToFreeze(target)) return;
            if ((status === 'poison' || status === 'toxic') && Immunity.isImmuneToPoison(target)) return;
            if (status === 'infatuation' && (Oblivious.isImmuneToInfatuation(target) || AromaVeil.isImmune(target, status))) return;
            if (status === 'taunt' && (Oblivious.isImmuneToTaunt(target) || AromaVeil.isImmune(target, status))) return;
            if (status === 'confusion' && (OwnTempo.isImmuneToConfusion(target) || FlowerVeil.isImmuneToStatus(target, false))) return;
            
            if (LeafGuard.isImmuneToStatus(target, state?.weather || 'none', state)) {
                log(logs, `${target.name} protegeu-se do status com sua Guarda Folha sob o sol!`, 'text-green-600 italic text-xs');
                return;
            }

            if (AromaVeil.isImmune(target, status)) return;
            if (FlowerVeil.isImmuneToStatus(target, false)) return;
        }
        
        // Imunidades de Tipo
        if ((status === 'poison' || status === 'toxic') && (target.types.includes('steel') || target.types.includes('poison')) && attacker?.ability !== 'corrosion') return;
        if (status === 'paralysis' && target.types.includes('electric')) return;
        
        target.statusEffects[status] = { turns: 0 }; 
        log(logs, `${target.name} sofreu ${STATUS_TRANSLATIONS[status]?.name || status}!`, 'text-yellow-600');
        
        if (attacker && !isFromSynchronize) {
             PoisonPuppeteer.handlePoisonPuppeteer(attacker, target, status, logs, applyStatus, state);
        }

        if (!isFromSynchronize && attacker && !attacker.isFainted && target.ability === 'synchronize') {
            const syncStatus = ['burn', 'poison', 'toxic', 'paralysis'];
            if (syncStatus.includes(status)) applyStatus(attacker, status, logs, target, true, state);
        }
        checkConsumableItems(target, logs, state);
    }
};
