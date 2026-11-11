
import { ContactEventPayload } from '../BattleEventBus';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { log } from '../../utils';
import * as StatusEffect from '../../../effectHandlers';

// Import Handlers
import * as CuteCharm from '../../handlers/abilities/cute_charm';
import * as EffectSpore from '../../handlers/abilities/effect_spore';
import * as RoughSkin from '../../handlers/abilities/rough_skin';
import * as LingeringAroma from '../../handlers/abilities/lingering_aroma';
import * as Pickpocket from '../../handlers/abilities/pickpocket';
import * as WanderingSpirit from '../../handlers/abilities/wandering_spirit';
import * as PoisonTouch from '../../handlers/abilities/poison_touch';
import * as Gooey from '../../handlers/abilities/gooey';
import * as TanglingHair from '../../handlers/abilities/tangling_hair';
import * as PerishBody from '../../handlers/abilities/perish_body';

// --- Move Mechanics Listeners ---

export const beakBlastListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (defender.selectedMove?.name === 'beak-blast' && !defender.movedThisTurn && !attacker.isFainted) {
        log(logs, BATTLE_MESSAGES.BEAK_BLAST_CONTACT_BURN(attacker.name, defender.name), 'text-orange-600 font-bold');
        StatusEffect.applyStatus(attacker, 'burn', logs, defender);
    }
};

// --- Item Listeners ---

export const rockyHelmetListener = (payload: ContactEventPayload) => {
    const { attacker, hitsLanded, logs } = payload;
    if (attacker.ability !== 'magic-guard' && !attacker.isFainted) {
        const recoil = Math.floor(attacker.maxHP / 6) * hitsLanded;
        attacker.hp = Math.max(0, attacker.hp - recoil);
        log(logs, `${attacker.name} se machucou no Capacete Dentado! (-${recoil})`, 'text-red-600');
    }
};

// --- Ability Listeners (Defender) ---

export const staticListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted && Math.random() < 0.3) {
        StatusEffect.applyStatus(attacker, 'paralysis', logs, defender);
    }
};

export const poisonPointListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted && Math.random() < 0.3) {
        StatusEffect.applyStatus(attacker, 'poison', logs, defender);
    }
};

export const flameBodyListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted && Math.random() < 0.3) {
        StatusEffect.applyStatus(attacker, 'burn', logs, defender);
    }
};

export const cuteCharmListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted) {
        CuteCharm.handleCuteCharm(attacker, defender, logs);
    }
};

export const effectSporeListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted) {
        EffectSpore.handleEffectSpore(attacker, defender, logs);
    }
};

export const gooeyListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs, state } = payload;
    if (!attacker.isFainted) {
        Gooey.handleGooey(attacker, defender, true, logs, state);
    }
};

export const tanglingHairListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs, state } = payload;
    if (!attacker.isFainted) {
        TanglingHair.handleTanglingHair(attacker, defender, true, logs, state);
    }
};

export const perishBodyListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted) {
        PerishBody.handlePerishBody(defender, attacker, true, logs);
    }
};

export const roughSkinListener = (payload: ContactEventPayload) => {
    const { attacker, defender, hitsLanded, logs } = payload;
    if (!attacker.isFainted) {
        RoughSkin.handleRoughSkin(attacker, defender, hitsLanded, logs);
    }
};

export const lingeringAromaListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted) {
        LingeringAroma.handleLingeringAroma(attacker, defender, true, logs);
    }
};

export const wanderingSpiritListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted) {
        WanderingSpirit.handleWanderingSpirit(attacker, defender, true, logs);
    }
};

export const pickpocketListener = (payload: ContactEventPayload) => {
    const { attacker, defender, logs } = payload;
    if (!attacker.isFainted) {
        Pickpocket.handlePickpocket(attacker, defender, true, logs);
    }
};

// --- Ability Listeners (Attacker) ---

export const poisonTouchListener = (payload: ContactEventPayload) => {
    const { attacker, defender, hitsLanded, logs } = payload;
    if (!attacker.isFainted) {
        PoisonTouch.handlePoisonTouch(attacker, defender, hitsLanded, true, logs);
    }
};

// --- Registry Maps ---

export const CONTACT_ABILITY_LISTENERS: Record<string, (p: ContactEventPayload) => void> = {
    'static': staticListener,
    'poison-point': poisonPointListener,
    'flame-body': flameBodyListener,
    'cute-charm': cuteCharmListener,
    'effect-spore': effectSporeListener,
    'gooey': gooeyListener,
    'tangling-hair': tanglingHairListener,
    'perish-body': perishBodyListener,
    'rough-skin': roughSkinListener,
    'iron-barbs': roughSkinListener,
    'lingering-aroma': lingeringAromaListener,
    'mummy': lingeringAromaListener,
    'wandering-spirit': wanderingSpiritListener,
    'pickpocket': pickpocketListener,
    // Note: Poison Touch is registered manually based on attacker, not defender lookup
};

export const CONTACT_ITEM_LISTENERS: Record<string, (p: ContactEventPayload) => void> = {
    'rocky-helmet': rockyHelmetListener
};
