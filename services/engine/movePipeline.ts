
import { BattleState, Pokemon, Move, BattleConfig, LogEntry, Action } from '../../types';
import { calculateTypeEffectiveness, calculateHitChance, isContactMove } from '../battleUtils';
import { log } from './utils';
import { BATTLE_MESSAGES } from '../../data/battleMessages';
import { RECHARGE_MOVES, SOUND_MOVES } from '../../data/moves';

import * as DamageUtils from './handlers/damageUtils';
import * as MoveEffects from './handlers/moveEffects';
import * as MagicReflection from './handlers/magicReflection';
import * as Effects from '../effectHandlers';

import * as AbilityStatus from './handlers/abilities/status';
import * as CriticalAbility from './handlers/abilities/critical';
import * as SkillLink from './handlers/abilities/skill_link';
import * as Merciless from './handlers/abilities/merciless';
import * as Sturdy from './handlers/abilities/sturdy';
import * as Electromorphosis from './handlers/abilities/electromorphosis';
import * as Dancer from './handlers/abilities/dancer';
import * as Klutz from './handlers/abilities/klutz';
import * as Illusion from './handlers/abilities/illusion';
import * as AirLock from './handlers/abilities/air_lock';
import * as Dazzling from './handlers/abilities/dazzling';
import * as MyceliumMight from './handlers/abilities/mycelium_might';
import * as MoldBreaker from './handlers/abilities/mold_breaker';
import * as Refrigerate from './handlers/abilities/refrigerate';
import * as Pixilate from './handlers/abilities/pixilate';
import * as LiquidVoice from './handlers/abilities/liquid_voice';
import * as Normalize from './handlers/abilities/normalize';
import * as NeutralizingGas from './handlers/abilities/neutralizing_gas';
import * as HungerSwitch from './handlers/abilities/hunger_switch';
import * as WonderGuard from './handlers/abilities/wonder_guard';
import * as GulpMissile from './handlers/abilities/gulp_missile';
import * as UnseenFist from './handlers/abilities/unseen_fist';
import * as Infiltrator from './handlers/abilities/infiltrator';
import * as FuryCutter from './handlers/moves/furyCutter';
import * as EchoedVoice from './handlers/moves/echoedVoice';
import * as HiddenPower from './handlers/moves/hiddenPower';
import * as WeatherBall from './handlers/moves/weatherBall';
import * as TerrainPulse from './handlers/moves/terrainPulse';
import * as FrostBreath from './handlers/moves/frostBreath';
import * as Rollout from './handlers/moves/rollout';
import * as HyperDrill from './handlers/moves/hyperDrill';
import * as ScreenBreak from './handlers/moves/screenBreak';
import * as RedCard from './handlers/items/redCard';
import * as EjectButton from './handlers/items/ejectButton';
import * as FalseSwipe from './handlers/moves/falseSwipe';
import * as SupercellSlam from './handlers/moves/supercellSlam';
import * as Endure from './handlers/moves/endure';
import * as SilkTrap from './handlers/moves/silkTrap';
import * as TeraBlast from './handlers/moves/teraBlast';
import * as TeraStarstorm from './handlers/moves/teraStarstorm';
import * as NaturalGift from './handlers/moves/naturalGift';
import * as MoongeistBeam from './handlers/moves/moongeistBeam';
import * as SpikyShield from './handlers/moves/spikyShield';
import * as MindBlown from './handlers/moves/mindBlown';
import * as SteelBeam from './handlers/moves/steelBeam';
import * as Chloroblast from './handlers/moves/chloroblast';
import * as GaleWings from './handlers/abilities/gale_wings';
import * as Prankster from './handlers/abilities/prankster';
import * as GrassyGlide from './handlers/moves/grassyGlide';
import AudioManager from '../audio/AudioManager';

export interface MovePipelineContext {
    state: BattleState;
    attacker: Pokemon;
    defender: Pokemon;
    move: Move;
    config: BattleConfig;
    logs: LogEntry[];
    defenderAction?: Action;
    // Calculated Properties
    effectiveType: string;
    isGasActive: boolean;
    isWeatherSuppressed: boolean;
    effectiveWeather: string;
    ignoresAbilities: boolean;
    // Output Flags
    damageDealt: boolean;
    switchRequested: boolean;
    defenderSwitchRequested: boolean;
    isBatonPass: boolean;
    fainted: boolean;
}

export function initializeContext(
    state: BattleState,
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    config: BattleConfig,
    logs: LogEntry[],
    defenderAction?: Action
): MovePipelineContext {
    const isWeatherSuppressed = AirLock.isWeatherSuppressed(state);
    const effectiveWeather = isWeatherSuppressed ? 'none' : state.weather;
    const isGasActive = NeutralizingGas.isGasActive(state);
    
    // Initial ignoresAbilities check (can be updated later by Moongeist Beam etc)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability) || 
                             MyceliumMight.shouldIgnoreAbilities(attacker, move);

    return {
        state, attacker, defender, move, config, logs, defenderAction,
        effectiveType: move.type,
        isGasActive,
        isWeatherSuppressed,
        effectiveWeather,
        ignoresAbilities,
        damageDealt: false,
        switchRequested: false,
        defenderSwitchRequested: false,
        isBatonPass: false,
        fainted: false
    };
}

export function checkAccuracyStep(ctx: MovePipelineContext): boolean {
    const { move, attacker, defender, effectiveWeather, state, logs, config } = ctx;

    // Expectimax Override
    if (config.forceAccuracyOutcome === 'hit') return false;
    if (config.forceAccuracyOutcome === 'miss') {
        log(logs, BATTLE_MESSAGES.MISS(), 'text-gray-500 italic');
        attacker.lastMoveFailed = true;
        if (move.name === 'fury-cutter') FuryCutter.resetStreak(attacker);
        if (move.name === 'echoed-voice') EchoedVoice.resetStreak(attacker);
        if (move.name === 'rollout') Rollout.resetRollout(attacker);
        return true;
    }

    const hitChance = calculateHitChance(move, attacker, defender, effectiveWeather, state.gravity);
    
    if (hitChance !== '∞' && Math.random() * 100 > (hitChance as number)) {
        log(logs, BATTLE_MESSAGES.MISS(), 'text-gray-500 italic');
        
        attacker.lastMoveFailed = true;

        if (move.name === 'fury-cutter') FuryCutter.resetStreak(attacker);
        if (move.name === 'echoed-voice') EchoedVoice.resetStreak(attacker);
        if (move.name === 'rollout') Rollout.resetRollout(attacker);

        if (move.name === 'high-jump-kick' || move.name === 'jump-kick' || move.name === 'supercell-slam') {
            SupercellSlam.handleCrashDamage(attacker, logs, state);
            if (attacker.hp === 0) attacker.isFainted = true;
        }
        
        if (move.name === 'mind-blown') {
            MindBlown.handleMindBlownRecoil(attacker, logs, state);
            if (attacker.hp === 0) attacker.isFainted = true;
        }

        if (move.name === 'steel-beam') {
            SteelBeam.handleSteelBeamRecoil(attacker, logs, state);
            if (attacker.hp === 0) attacker.isFainted = true;
        }

        if (move.name === 'chloroblast') {
            Chloroblast.handleChloroblastRecoil(attacker, logs, state);
            if (attacker.hp === 0) attacker.isFainted = true;
        }
        
        // Return TRUE to abort pipeline (missed)
        return true; 
    }

    return false; // Proceed
}

export function resolveEffectiveType(ctx: MovePipelineContext): MovePipelineContext {
    const { attacker, move, state, effectiveWeather, isGasActive } = ctx;
    
    // Updates base ignore abilities if moved dependent (Moongeist Beam)
    if (MoongeistBeam.ignoresAbilities(move)) {
        ctx.ignoresAbilities = true;
    }

    const baseMoveType = HungerSwitch.getAuraWheelType(attacker, move);
    let effectiveMoveType = baseMoveType;

    if (move.name === 'tera-blast') {
        effectiveMoveType = TeraBlast.getTeraBlastType(attacker);
    }

    if (move.name === 'tera-starstorm') {
        effectiveMoveType = TeraStarstorm.getTeraStarstormType(attacker);
    }
    
    effectiveMoveType = HiddenPower.getEffectiveType(attacker, { ...move, type: effectiveMoveType });

    if (move.name === 'weather-ball') {
        effectiveMoveType = WeatherBall.getEffectiveType(effectiveWeather);
    }

    if (move.name === 'terrain-pulse') {
        effectiveMoveType = TerrainPulse.getEffectiveType(attacker, state.terrain);
    }

    if (move.name === 'natural-gift') {
        const consumed = attacker.consumedItem;
        if (consumed) {
            const config = NaturalGift.getNaturalGiftConfig(consumed);
            if (config) {
                effectiveMoveType = config.type;
            }
        }
    }

    if (!isGasActive) {
        effectiveMoveType = LiquidVoice.getModifiedType(attacker, { ...move, type: effectiveMoveType });
        effectiveMoveType = Normalize.getEffectiveMoveType(attacker, { ...move, type: effectiveMoveType }); 
        effectiveMoveType = Refrigerate.getEffectiveMoveType(attacker, { ...move, type: effectiveMoveType });
        effectiveMoveType = Pixilate.getEffectiveMoveType(attacker, { ...move, type: effectiveMoveType });
    }

    // Eletrificar (Electrify) - Tem prioridade sobre as habilidades de mudança de tipo
    if (attacker.statusEffects['electrify']) {
        effectiveMoveType = 'electric';
    }

    // Plasma Fists - Normal moves become Electric
    if (attacker.statusEffects['plasma-fists'] && effectiveMoveType === 'normal') {
        effectiveMoveType = 'electric';
    }

    ctx.effectiveType = effectiveMoveType;
    return ctx;
}

export function preExecutionStep(ctx: MovePipelineContext): void {
    const { move, attacker, defender, state, logs } = ctx;

    if (RECHARGE_MOVES.includes(move.name)) attacker.mustRecharge = true;

    if (['brick-break', 'psychic-fangs', 'raging-bull'].includes(move.name)) {
        ScreenBreak.handleScreenBreak(state, defender, logs);
    }
}

function targetsOpponent(move: Move): boolean {
    const opponentTargetMoves = [
        'sand-attack', 'baby-doll-eyes', 'attract', 'swagger', 'flatter', 'yawn', 'taunt', 'torment',
        'encore', 'disable', 'roar', 'whirlwind', 'telekinesis', 'strength-sap', 'heal-block',
        'trick', 'switcheroo', 'pain-split', 'skill-swap', 'entrainment', 'simple-beam', 'worry-seed',
        'role-play', 'gastro-acid', 'transform', 'leech-seed', 'embargo', 'spite', 'nightmare',
        'tickle', 'noble-roar', 'play-nice', 'tearful-look', 'confide', 'sweet-scent', 'charm',
        'captivate', 'eerie-impulse', 'feather-dance', 'flash', 'after-you', 'quash', 'toxic-thread',
        'bestow', 'corrosive-gas', 'guard-split', 'guard-swap', 'power-swap', 'venom-drench',
        'reflect-type', 'speed-swap', 'trick-or-treat', 'ion-deluge'
    ];
    
    if (opponentTargetMoves.includes(move.name)) return true;
    
    if (move.effect) {
        if (move.effect.status.includes('-down')) return true;
        if (['paralysis', 'burn', 'poison', 'bad-poison', 'sleep', 'freeze', 'confusion', 'toxic'].includes(move.effect.status)) return true;
    }
    
    return false;
}

export function executeStatusMoveStep(ctx: MovePipelineContext): void {
    const { state, attacker, defender, move, logs, effectiveType } = ctx;

    // Quick Guard Check (Moves with priority)
    if (defender.statusEffects['quick-guard']) {
        let p = move.priority || 0;
        if (!NeutralizingGas.isGasActive(state)) {
            p += GaleWings.getPriorityBoost(attacker, move);
            p += Prankster.getPriorityBoost(attacker, move);
            if (move.name === 'grassy-glide') p += GrassyGlide.getPriorityBoost(attacker, state);
        }

        if (p > 0 && !Infiltrator.canInfiltrate(attacker, state) && !['feint', 'phantom-force', 'shadow-force', 'hyperspace-hole', 'hyperspace-fury'].includes(move.name)) {
             log(logs, `A Guarda Rápida de ${defender.name} protegeu-o!`, 'text-blue-500 italic font-bold');
             attacker.lastMoveFailed = true;
             return;
        }
    }

    // Crafty Shield Check
    if (defender.statusEffects['crafty-shield'] && !Infiltrator.canInfiltrate(attacker, state)) {
        log(logs, `O Escudo Astuto de ${defender.name} protegeu-o!`, 'text-pink-500 italic');
        attacker.lastMoveFailed = true;
        return;
    }

    // Substitute Check
    if (defender.statusEffects['substitute']) {
        const isSoundMove = SOUND_MOVES.includes(move.name);
        const bypassesSubstitute = Infiltrator.canInfiltrate(attacker, state) || isSoundMove;
        
        let isOpponentTarget = targetsOpponent(move);
        if (move.name === 'curse') {
            const isGhost = attacker.isTerastallized ? attacker.teraType === 'ghost' : attacker.types.includes('ghost');
            if (isGhost) isOpponentTarget = true;
        }
        
        if (!bypassesSubstitute && isOpponentTarget) {
            log(logs, `O Substitute protegeu ${defender.name} do efeito!`, 'text-gray-500 italic text-[10px]');
            attacker.lastMoveFailed = true;
            return;
        }
    }

    // --- MAGIC REFLECTION CHECK ---
    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);
    if (MagicReflection.handleMagicReflection(attacker, defender, move, logs, ignoresAbilities)) {
        // Reflected! Execute move with swapped roles
        // Note: We use move.type (base type) to avoid applying attacker's type-changing abilities to the reflected move.
        // Ideally we would recalculate type for defender, but for now base type is safer than attacker's modified type.
        const reflectedRes = MoveEffects.handleStatusMove(state, defender, attacker, { ...move, type: move.type }, logs);
        
        if (reflectedRes.switchRequested) ctx.defenderSwitchRequested = true;
        if (reflectedRes.defenderSwitchRequested) ctx.switchRequested = true;
        
        attacker.lastMoveFailed = false;
        return;
    }
    // ------------------------------

    const statusRes = MoveEffects.handleStatusMove(state, attacker, defender, { ...move, type: effectiveType }, logs);
    
    const lastLog = logs[logs.length - 1]?.message || "";
    if (lastLog.includes("Não afetou") || lastLog.includes("Imune") || lastLog.includes("refletiu")) {
        attacker.lastMoveFailed = true;
    } else {
        attacker.lastMoveFailed = false;
    }

    if (statusRes.defenderSwitchRequested) ctx.defenderSwitchRequested = true;
    
    const team = attacker === state.currentPokemon1 ? state.team1 : state.team2;
    if (MoveEffects.checkSelfSwitch(attacker, move, team, logs) || statusRes.switchRequested) {
        ctx.switchRequested = true;
        ctx.isBatonPass = statusRes.isBatonPass || false;
    }

    Effects.checkSchooling(attacker, logs);
    Effects.checkShieldsDown(attacker, logs);
}

export function executeDamageMoveStep(ctx: MovePipelineContext): void {
    const { state, attacker, defender, move, logs, effectiveType, effectiveWeather, isGasActive, ignoresAbilities, defenderAction } = ctx;
    const attackerItemsSuppressed = Klutz.isItemSuppressed(attacker, state);
    
    HyperDrill.handleProtectionBreak(attacker, defender, move, logs);

    const protectStatuses = ['protect', 'detect', 'spiky-shield', 'kings-shield', 'baneful-bunker', 'obstruct', 'silk-trap', 'burning-bulwark', 'quick-guard'];
    const isProtected = protectStatuses.some(s => defender.statusEffects[s]);

    if (isProtected) {
        // Verifica se Quick Guard bloqueia este movimento específico
        if (defender.statusEffects['quick-guard']) {
            let p = move.priority || 0;
            // Recalcula boost de prioridade para verificar Quick Guard
            if (!isGasActive) {
                p += GaleWings.getPriorityBoost(attacker, move);
                p += Prankster.getPriorityBoost(attacker, move);
                if (move.name === 'grassy-glide') p += GrassyGlide.getPriorityBoost(attacker, state);
            }
            
            // Se prioridade <= 0, Quick Guard não protege (a menos que outro protect esteja ativo)
            if (p <= 0 && !protectStatuses.filter(s => s !== 'quick-guard').some(s => defender.statusEffects[s])) {
                // Passa direto (Quick Guard ignora ataques sem prioridade)
            } else if (p > 0) {
                 // Bloqueado por Quick Guard
                 if (!UnseenFist.canBypassProtection(attacker, move)) {
                     log(logs, `A Guarda Rápida de ${defender.name} protegeu-o!`, 'text-blue-500 italic font-bold');
                     attacker.lastMoveFailed = true;
                     return;
                 }
            }
        }
        
        // Verifica proteção padrão
        const isStandardProtect = protectStatuses.filter(s => s !== 'quick-guard').some(s => defender.statusEffects[s]);
        
        if (isStandardProtect) {
            if (UnseenFist.canBypassProtection(attacker, move)) {
                log(logs, `O Punho Invisível de ${attacker.name} atravessou a proteção!`, 'text-red-600 font-bold');
            } else {
                log(logs, `${defender.name} protegeu-se do ataque!`, 'text-gray-500');
                attacker.lastMoveFailed = true;
                
                if (isContactMove(move)) {
                    SilkTrap.handleContact(defender, attacker, logs);
                    SpikyShield.handleContact(defender, attacker, logs);
                }

                if (move.name === 'high-jump-kick' || move.name === 'jump-kick' || move.name === 'supercell-slam') {
                    SupercellSlam.handleCrashDamage(attacker, logs, state);
                    if (attacker.hp === 0) attacker.isFainted = true;
                }
                // Steel Beam / Mind Blown / Chloroblast recoil on protect
                if (move.name === 'steel-beam') {
                    SteelBeam.handleSteelBeamRecoil(attacker, logs, state);
                    if (attacker.hp === 0) attacker.isFainted = true;
                }
                if (move.name === 'chloroblast') {
                    Chloroblast.handleChloroblastRecoil(attacker, logs, state);
                    if (attacker.hp === 0) attacker.isFainted = true;
                }
                if (move.name === 'mind-blown') {
                    MindBlown.handleMindBlownRecoil(attacker, logs, state);
                    if (attacker.hp === 0) attacker.isFainted = true;
                }
                return;
            }
        }
    }

    // PASS STATE TO SKILL LINK (CRITICAL FIX FOR BEAT UP)
    const hits = SkillLink.getHitCount(attacker, move, state);
    const initialDefenderHp = defender.hp;
    let hitsLanded = 0;
    let totalDamage = 0;
    let hitSubstituteOnLastHit = false;

    for (let i = 0; i < hits; i++) {
        if (i > 0 && ['population-bomb', 'triple-axel', 'triple-kick'].includes(move.name)) {
            if (attacker.ability !== 'skill-link') {
                const subHitChance = calculateHitChance(move, attacker, defender, effectiveWeather, state.gravity);
                if (subHitChance !== '∞' && Math.random() * 100 > (subHitChance as number)) {
                    break;
                }
            }
        }

        const critStage = CriticalAbility.getCritStage(attacker, move, attackerItemsSuppressed);
        let critChance = 0.0417; 
        if (critStage === 1) critChance = 0.125; 
        else if (critStage === 2) critChance = 0.5; 
        else if (critStage >= 3) critChance = 1.0; 

        let isCrit = Math.random() < critChance;
        if (Merciless.isCritGuaranteed(attacker, defender)) isCrit = true;
        if (FrostBreath.isCriticalGuaranteed(move.name)) isCrit = true;
        if (attacker.statusEffects['laser-focus']) isCrit = true;
        
        // CORREÇÃO CRÍTICA: Passar state para verificar Lucky Chant
        if (isCrit && CriticalAbility.isImmuneToCritical(defender, ignoresAbilities, state)) isCrit = false;

        const defenderTypes = defender.isTerastallized ? [defender.teraType || 'normal'] : defender.types;
        const defenderStatus = { ...defender.statusEffects, isTerastallized: defender.isTerastallized };
        const eff = calculateTypeEffectiveness(effectiveType, defenderTypes, defender.ability, attacker.ability, move.name, defenderStatus);
      
        if (WonderGuard.isImmune(defender, eff.multiplier, { ...move, type: effectiveType }, ignoresAbilities, state)) {
            if (i === 0) log(logs, BATTLE_MESSAGES.WONDER_GUARD_IMMUNE(defender.name), 'text-gray-500 italic');
            hitsLanded = i;
            attacker.lastMoveFailed = true; 
            if (move.name === 'rollout') Rollout.resetRollout(attacker);
            if (move.name === 'high-jump-kick' || move.name === 'jump-kick' || move.name === 'supercell-slam') {
                SupercellSlam.handleCrashDamage(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'steel-beam') {
                SteelBeam.handleSteelBeamRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'chloroblast') {
                Chloroblast.handleChloroblastRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'mind-blown') {
                MindBlown.handleMindBlownRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            break;
        }

        if (eff.immunityType) {
            if (i === 0) MoveEffects.handleImmunityAbility(defender, eff.immunityType, logs);
            hitsLanded = i;
            attacker.lastMoveFailed = true; 
            if (move.name === 'rollout') Rollout.resetRollout(attacker);
            if (move.name === 'high-jump-kick' || move.name === 'jump-kick' || move.name === 'supercell-slam') {
                SupercellSlam.handleCrashDamage(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'steel-beam') {
                SteelBeam.handleSteelBeamRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'chloroblast') {
                Chloroblast.handleChloroblastRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'mind-blown') {
                MindBlown.handleMindBlownRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            break;
        }

        let finalMultiplier = eff.multiplier;
        if (state.gravity && effectiveType === 'ground' && finalMultiplier === 0) {
            if (defender.types.includes('flying') || defender.ability === 'levitate') {
                const groundedTypes = defenderTypes.filter(t => t !== 'flying');
                if (groundedTypes.length === 0) {
                    finalMultiplier = 1.0;
                } else {
                    const newEff = calculateTypeEffectiveness(effectiveType, groundedTypes, defender.ability === 'levitate' ? 'none' : defender.ability, attacker.ability, move.name, defenderStatus);
                    finalMultiplier = newEff.multiplier;
                }
            }
        }

        if (finalMultiplier === 0) {
            if (i === 0) log(logs, eff.message, eff.color);
            hitsLanded = i;
            attacker.lastMoveFailed = true; 
            if (move.name === 'rollout') Rollout.resetRollout(attacker);
            if (move.name === 'high-jump-kick' || move.name === 'jump-kick' || move.name === 'supercell-slam') {
                SupercellSlam.handleCrashDamage(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'steel-beam') {
                SteelBeam.handleSteelBeamRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'chloroblast') {
                Chloroblast.handleChloroblastRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            if (move.name === 'mind-blown') {
                MindBlown.handleMindBlownRecoil(attacker, logs, state);
                if (attacker.hp === 0) attacker.isFainted = true;
            }
            break;
        }

        let damage = DamageUtils.calculateDamage(attacker, defender, { ...move, type: effectiveType }, state.weather, isCrit, finalMultiplier, i, logs, state, ctx.config.fixedRoll, defenderAction);
        
        // --- STURDY CHECK (Updated with State) ---
        damage = Sturdy.applySturdy(defender, damage, ignoresAbilities, logs, state);
        damage = Endure.applyEndure(defender, damage, logs);

        if (move.name === 'false-swipe') {
            damage = FalseSwipe.limitDamage(damage, defender.hp);
        }

        const hasSubstitute = !!defender.statusEffects['substitute'];
        const isSoundMove = SOUND_MOVES.includes(move.name);
        const bypassesSubstitute = Infiltrator.canInfiltrate(attacker, state) || isSoundMove;

        let appliedDamage = 0;

        if (hasSubstitute && !bypassesSubstitute) {
            hitSubstituteOnLastHit = true;
            let subHP = defender.statusEffects['substitute'].hp || 0;
            appliedDamage = Math.min(subHP, damage);
            subHP -= damage;
            
            defender.statusEffects['substitute'].hp = subHP;
            log(logs, BATTLE_MESSAGES.SUBSTITUTE_DAMAGED(), 'text-gray-500 text-xs italic');

            if (subHP <= 0) {
                delete defender.statusEffects['substitute'];
                log(logs, BATTLE_MESSAGES.SUBSTITUTE_BROKE(defender.name), 'text-orange-600 font-bold italic');
            }
        } else {
            hitSubstituteOnLastHit = false;
            const prevHp = defender.hp;
            defender.hp = Math.max(0, defender.hp - damage);
            appliedDamage = prevHp - defender.hp;
        }

        // --- SFX HOOK ---
        if (i === 0) {
             if (finalMultiplier >= 2.0) {
                 AudioManager.playSfx('super-effective');
             } else if (finalMultiplier > 0 && finalMultiplier < 1.0) {
                 AudioManager.playSfx('not-very-effective');
             } else {
                 AudioManager.playSfx('hit');
             }
        }
        // ----------------

        Effects.checkConsumableItems(defender, logs, state);

        hitsLanded++;
        totalDamage += appliedDamage;
        if (appliedDamage > 0) ctx.damageDealt = true;

        if (appliedDamage > 0) {
            defender.statusEffects['avalanche-tracker'] = { turns: 1, sourceMoveName: attacker.id.toString() };
            if (move.damageClass === 'physical') {
                const currentPhysDamage = defender.statusEffects['physical-damage-taken']?.damageAccumulated || 0;
                defender.statusEffects['physical-damage-taken'] = { turns: 1, damageAccumulated: currentPhysDamage + appliedDamage };
            }
            if (move.damageClass === 'special') {
                const currentSpecialDamage = defender.statusEffects['special-damage-taken']?.damageAccumulated || 0;
                defender.statusEffects['special-damage-taken'] = { turns: 1, damageAccumulated: currentSpecialDamage + appliedDamage };
            }
        }

        if (i === 0) log(logs, eff.message, eff.color);
        if (hits > 1) {
            log(logs, BATTLE_MESSAGES.MULTI_HIT_DAMAGE(i+1, appliedDamage, isCrit), isCrit ? 'text-red-600 font-bold' : 'text-gray-700 font-medium');
        } else {
            if (isCrit) log(logs, BATTLE_MESSAGES.CRITICAL_HIT(), "text-red-600 font-black text-lg");
            log(logs, BATTLE_MESSAGES.DAMAGE_DEALT(appliedDamage), 'text-red-700 font-bold');
        }

        MoveEffects.handleRecoil(attacker, move, appliedDamage, i, logs, state);
        MoveEffects.handleOnHit(attacker, defender, move, logs, state, initialDefenderHp, isCrit);
        MoveEffects.handleDrain(attacker, defender, move, appliedDamage, i, logs);
        if (defender.hp === 0 || attacker.hp === 0) break;
    }

    if (totalDamage > 0 && Illusion.isUnderIllusion(defender)) {
        Illusion.breakIllusion(defender, logs);
    }

    Electromorphosis.consumeChargedEffect(attacker, effectiveType);

    if (hits > 1) log(logs, BATTLE_MESSAGES.TOTAL_HIT_COUNT(hitsLanded, totalDamage), 'text-gray-800 font-black text-lg');

    if (hitsLanded > 0) {
        attacker.lastMoveFailed = false;

        MoveEffects.handleLifeOrbRecoil(attacker, move, logs);
        
        if (EjectButton.handleEjectButton(defender, state, logs)) {
            ctx.defenderSwitchRequested = true;
        }

        RedCard.checkRedCard(defender, attacker, state, logs);
        AbilityStatus.handleCursedBody(attacker, defender, move, logs);
        const attackerTeam = attacker === state.currentPokemon1 ? state.team1 : state.team2;
        if (MoveEffects.checkSelfSwitch(attacker, move, attackerTeam, logs)) ctx.switchRequested = true;

        if (!defender.isFainted && (defender.ability === 'emergency-exit' || defender.ability === 'wimp-out')) {
            if (defender.hp > 0 && initialDefenderHp > (defender.maxHP / 2) && defender.hp <= (defender.maxHP / 2)) {
                log(logs, BATTLE_MESSAGES.EMERGENCY_EXIT(defender.name), 'text-purple-600 font-bold');
                ctx.defenderSwitchRequested = true;
            }
        }
    }

    const secondaryRes = MoveEffects.handleSecondaryEffects(attacker, defender, move, logs, state, hitSubstituteOnLastHit);
    if (secondaryRes.defenderSwitchRequested) ctx.defenderSwitchRequested = true;
    
    MoveEffects.handleSelfDestruct(attacker, move, logs);
    MoveEffects.handleContactEffects(attacker, defender, move, hitsLanded, logs, state);

    GulpMissile.handleGulpMissileFormChange(attacker, move, logs);

    Effects.checkSchooling(attacker, logs);
    Effects.checkSchooling(defender, logs);
    Effects.checkShieldsDown(attacker, logs);
    Effects.checkShieldsDown(defender, logs);

    if (attacker.hp === 0) { 
        attacker.isFainted = true; 
        log(logs, BATTLE_MESSAGES.FAINTED(attacker.name), 'text-red-900 font-bold'); 
        ctx.fainted = true; 
        AudioManager.playSfx('faint'); // SFX Hook
    }
    if (defender.hp === 0) { 
        defender.isFainted = true; 
        log(logs, BATTLE_MESSAGES.FAINTED(defender.name), 'text-red-900 font-bold'); 
        AudioManager.playSfx('faint'); // SFX Hook
        MoveEffects.handleKnockoutAbilities(attacker, defender, move, logs, initialDefenderHp, state); 
    }
}
