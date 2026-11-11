
import { Pokemon, Move, BattleState, Action, LogEntry } from '../../../types';
import { log } from '../utils';
import { calculateStat } from './statCalculator';
import { BATTLE_MESSAGES } from '../../../data/battleMessages';
import { OHKO_MOVES } from '../../../data/moves/categories';
import { TYPE_ENHANCING_ITEMS } from '../../../data/items';
import * as AbilityModifiers from './abilities/damageModifiers';
import * as MoldBreaker from './abilities/mold_breaker';
import * as NeutralizingGas from './abilities/neutralizing_gas';
import * as AirLock from './abilities/air_lock';
import * as Klutz from './abilities/klutz';
import * as Unaware from './abilities/unaware';
import * as Sniper from './abilities/sniper';
import * as Refrigerate from './abilities/refrigerate';
import * as LiquidVoice from './abilities/liquid_voice';
import * as Pixilate from './abilities/pixilate';
import * as Galvanize from './abilities/galvanize';
import * as IonDeluge from './moves/ionDeluge';
import * as Normalize from './abilities/normalize';
import * as IceFace from './abilities/ice_face';
import * as Disguise from './abilities/disguise';
import * as HiddenPower from './moves/hiddenPower';
import * as TeraBlast from './moves/teraBlast';
import * as WeatherBall from './moves/weatherBall';
import * as TerrainPulse from './moves/terrainPulse';
import * as OHKO from './moves/ohko';
import * as DragonRage from './moves/dragonRage';
import * as SonicBoom from './moves/sonicBoom';
import * as Counter from './moves/counter';
import * as MirrorCoat from './moves/mirrorCoat';
import * as MetalBurst from './moves/metalBurst';
import * as FinalGambit from './moves/finalGambit';
import * as SeismicToss from './moves/seismicToss';
import * as Psyshock from './moves/psyshock';
import * as FoulPlay from './moves/foulPlay';
import * as TypeDamageHandler from './damage/index';
import * as SheerCold from './moves/sheerCold';
import * as ChipAway from './moves/chipAway';
import * as Reflect from './moves/reflect';
import * as HelpingHand from './moves/helpingHand';
import * as MoongeistBeam from './moves/moongeistBeam';

export function calculateDamage(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    weather: string,
    isCrit: boolean,
    typeEffectiveness: number,
    hitIndex: number,
    logs: LogEntry[],
    state?: BattleState,
    fixedRoll?: number,
    defenderAction?: Action
): number {
    // OHKO Moves Check
    if (OHKO_MOVES.includes(move.name)) {
        if (typeEffectiveness === 0) return 0; 
        
        // Verifica imunidade específica de Frio Absoluto (Tipos Gelo são imunes)
        if (move.name === 'sheer-cold' && SheerCold.isImmune(defender)) {
            log(logs, `Não afeta ${defender.name}...`, 'text-gray-500 italic');
            return 0;
        }

        return OHKO.calculateOHKODamage(defender);
    }

    if (move.name === 'final-gambit') {
        return FinalGambit.calculateFinalGambitDamage(attacker, typeEffectiveness);
    }

    if (move.name === 'seismic-toss') {
        return SeismicToss.calculateSeismicTossDamage(typeEffectiveness);
    }

    if (move.name === 'night-shade') return typeEffectiveness === 0 ? 0 : 50;
    
    if (move.name === 'dragon-rage') {
        return DragonRage.calculateDragonRageDamage(typeEffectiveness);
    }

    if (move.name === 'sonic-boom') {
        return SonicBoom.calculateSonicBoomDamage(typeEffectiveness);
    }

    if (move.name === 'counter') {
        return Counter.getCounterDamage(attacker, typeEffectiveness);
    }

    if (move.name === 'mirror-coat') {
        return MirrorCoat.getMirrorCoatDamage(attacker, typeEffectiveness);
    }

    if (move.name === 'metal-burst') {
        return MetalBurst.getMetalBurstDamage(attacker);
    }

    if (move.name === 'super-fang') return typeEffectiveness === 0 ? 0 : Math.max(1, Math.floor(defender.hp / 2));
    
    if (move.name === 'endeavor') {
        if (typeEffectiveness === 0) return 0; 
        if (attacker.hp >= defender.hp) {
            log(logs, BATTLE_MESSAGES.ENDEAVOR_FAIL(), 'text-gray-500 italic');
            return 0;
        }
        return defender.hp - attacker.hp;
    }

    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    const isWeatherSuppressed = AirLock.isWeatherSuppressed(state);
    const effectiveWeather = isWeatherSuppressed ? 'none' : weather;
    const currentTerrain = state?.terrain || 'none';
    const isWonderRoom = !!state?.wonderRoomActive; // Wonder Room Check

    let effectiveMoveType = move.type;
    let effectiveCategory = move.damageClass;

    if (move.name === 'tera-blast') {
        effectiveMoveType = TeraBlast.getTeraBlastType(attacker);
        effectiveCategory = TeraBlast.getTeraBlastCategory(attacker, effectiveWeather, isGasActive);
    }

    effectiveMoveType = HiddenPower.getEffectiveType(attacker, { ...move, type: effectiveMoveType });

    if (move.name === 'weather-ball') {
        effectiveMoveType = WeatherBall.getEffectiveType(effectiveWeather);
    }

    if (move.name === 'terrain-pulse') {
        effectiveMoveType = TerrainPulse.getEffectiveType(attacker, currentTerrain);
    }

    if (!isGasActive) {
        effectiveMoveType = LiquidVoice.getModifiedType(attacker, { ...move, type: effectiveMoveType });
        effectiveMoveType = IonDeluge.getEffectiveMoveType(state, { ...move, type: effectiveMoveType });
        effectiveMoveType = Normalize.getEffectiveMoveType(attacker, { ...move, type: effectiveMoveType });
        effectiveMoveType = Refrigerate.getEffectiveMoveType(attacker, { ...move, type: effectiveMoveType });
        effectiveMoveType = Pixilate.getEffectiveMoveType(attacker, { ...move, type: effectiveMoveType });
        effectiveMoveType = Galvanize.getEffectiveMoveType(attacker, { ...move, type: effectiveMoveType });
    }

    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability) || MoongeistBeam.ignoresAbilities(move);
    const ignoreAttackerStages = Unaware.shouldIgnoreOpponentAttackStages(defender, attacker.ability, isGasActive);
    
    // Unaware OR Chip Away ignores defender stages
    const ignoreDefenderStages = Unaware.shouldIgnoreOpponentDefenseStages(attacker, isGasActive) || ChipAway.shouldIgnoreDefensiveStats(move);

    let attackStat = 0;

    if (move.name === 'foul-play') {
        attackStat = FoulPlay.getFoulPlayAttack(attacker, defender, effectiveWeather, isGasActive, currentTerrain);
    } else if (move.name === 'body-press') {
        // Body Press usa Defesa. Wonder Room troca Defesa/SpDef.
        // Se Wonder Room estiver ativo, Body Press deve usar a SpDefense BASE, mas os stages de Defesa.
        // A função calculateStat atualizada já lida com isso através do argumento isWonderRoom.
        attackStat = calculateStat(attacker, 'defense', effectiveWeather, isGasActive, ignoreAttackerStages, currentTerrain, false, isWonderRoom, defender.ability);
    } else {
        attackStat = effectiveCategory === 'physical' 
            ? calculateStat(attacker, 'attack', effectiveWeather, isGasActive, ignoreAttackerStages, currentTerrain, false, isWonderRoom, defender.ability) 
            : calculateStat(attacker, 'spAttack', effectiveWeather, isGasActive, ignoreAttackerStages, currentTerrain, false, isWonderRoom, defender.ability);
    }
        
    let defenseStat = 0;
    
    if (Psyshock.targetsPhysicalDefense(move.name)) {
        // Psyshock: Usa SpAtk do atacante (já calculado) contra a Defesa do alvo.
        // Se Wonder Room ativo, a Defesa Física do alvo é calculada usando sua Base SpDef.
        defenseStat = calculateStat(defender, 'defense', effectiveWeather, isGasActive, ignoreDefenderStages, currentTerrain, false, isWonderRoom, attacker.ability);
    } else {
        defenseStat = effectiveCategory === 'physical' 
            ? calculateStat(defender, 'defense', effectiveWeather, isGasActive, ignoreDefenderStages, currentTerrain, false, isWonderRoom, attacker.ability) 
            : calculateStat(defender, 'spDefense', effectiveWeather, isGasActive, ignoreDefenderStages, currentTerrain, false, isWonderRoom, attacker.ability);
    }

    const basePower = TypeDamageHandler.calculateBasePower(
        attacker,
        defender,
        move,
        effectiveMoveType,
        state,
        hitIndex,
        logs,
        defenderAction
    );

    const level = attacker.level || 50;
    let damage = (((2 * level / 5 + 2) * basePower * attackStat / defenseStat) / 50 + 2);

    // Multiplicador de Mão Amiga (Helping Hand) - Adaptação 1v1
    // Aplicado antes de outros multiplicadores
    damage *= HelpingHand.getHelpingHandMultiplier(attacker, logs);

    // Multiplicador de Telas (Refletir / Tela de Luz / Véu Aurora)
    // Aplicado antes de clima e outros multiplicadores na maioria das fórmulas modernas,
    // mas a ordem exata varia. Aqui aplicamos cedo para consistência.
    damage *= Reflect.getDamageMultiplier(state, defender, attacker, { ...move, damageClass: effectiveCategory }, isCrit, logs);

    if (effectiveWeather === 'sun') {
        if (effectiveMoveType === 'fire') damage *= 1.5;
        else if (effectiveMoveType === 'water') damage *= 0.5;
    } else if (effectiveWeather === 'rain') {
        if (effectiveMoveType === 'water') damage *= 1.5;
        else if (effectiveMoveType === 'fire') damage *= 0.5;
    }

    damage *= AbilityModifiers.getAbilityDamageMultiplier(attacker, defender, move, hitIndex, logs, effectiveWeather, isGasActive, state, typeEffectiveness);

    if (attacker.isTerastallized) {
        if (effectiveMoveType === attacker.teraType) {
            if (attacker.types.includes(effectiveMoveType)) {
                damage *= 2.0;
                if (hitIndex === 0) log(logs, "Terastal + STAB Original = Dano Massivo!", "text-purple-600 text-[10px] font-bold italic");
            } else {
                damage *= 1.5;
                if (hitIndex === 0) log(logs, "Bônus de STAB Terastal!", "text-purple-600 text-[10px] italic");
            }
        } else if (attacker.types.includes(effectiveMoveType)) {
            damage *= 1.5;
            if (hitIndex === 0) log(logs, "Bônus de STAB Original mantido!", "text-indigo-600 text-[10px] italic");
        }
    } else {
        if (attacker.types.includes(effectiveMoveType)) {
           const isAdaptability = attacker.ability === 'adaptability' && !isGasActive;
           const stabBonus = isAdaptability ? 2 : 1.5;
           damage *= stabBonus;
           
           if (hitIndex === 0) {
               const msg = isAdaptability ? BATTLE_MESSAGES.STAB_ADAPTABILITY() : BATTLE_MESSAGES.STAB_BONUS();
               log(logs, msg, 'text-indigo-500 text-[10px] italic');
           }
        }
    }

    // Glaive Rush Vulnerability: Dobra o dano recebido
    if (defender.statusEffects['glaive-rush']) {
        damage *= 2.0;
        if (hitIndex === 0) log(logs, "Dano dobrado pela vulnerabilidade da Investida de Glaive!", "text-red-600 font-bold italic text-xs");
    }

    if (attacker.statusEffects.burn && effectiveCategory === 'physical' && attacker.ability !== 'guts' && move.name !== 'facade') {
      damage *= 0.5;
    }

    const attackerKlutz = Klutz.isItemSuppressed(attacker, state);
    if (!attackerKlutz) {
        if (attacker.heldItem === 'life-orb') {
            damage *= 1.3;
            if (hitIndex === 0) log(logs, BATTLE_MESSAGES.LIFE_ORB_BOOST(), "text-pink-600 italic text-xs");
        }
        if (attacker.heldItem === 'expert-belt' && typeEffectiveness >= 2) {
            damage *= 1.2;
        }
        if (attacker.heldItem && TYPE_ENHANCING_ITEMS[attacker.heldItem] === effectiveMoveType) {
            damage *= 1.2;
        }
    }

    damage *= AbilityModifiers.getDefensiveMultipliers(defender, move, hitIndex, logs, attacker.ability, typeEffectiveness, isGasActive, attacker, state);
    damage *= typeEffectiveness;

    const roll = fixedRoll !== undefined ? fixedRoll : (Math.floor(Math.random() * 16) + 85);
    damage = (damage * roll) / 100;

    if (isCrit) {
        const critMult = Sniper.getCritMultiplier(attacker, isGasActive);
        damage *= critMult;
    }

    let finalDamage = Math.floor(damage);
    if (finalDamage < 1 && typeEffectiveness > 0) finalDamage = 1;
    
    if (!isGasActive) {
        finalDamage = IceFace.handleIceFaceDamage(defender, move, finalDamage, logs);
        finalDamage = Disguise.handleDisguiseDamage(defender, move, finalDamage, ignoresAbilities, logs);
    }
    
    return finalDamage;
}
