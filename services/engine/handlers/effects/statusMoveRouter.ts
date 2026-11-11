
import { BattleState, Pokemon, Move, LogEntry } from '../../../../types';
import * as MoldBreaker from '../abilities/mold_breaker';

import * as ReflectType from '../moves/reflectType';
import * as WonderRoom from '../moves/wonderRoom';
import * as MagicRoom from '../moves/magicRoom';
import * as LifeDew from '../moves/lifeDew';
import * as SlackOff from '../moves/slackOff';
import * as Snatch from '../moves/snatch';
import * as SandAttack from '../moves/sandAttack';
import * as BabyDollEyes from '../moves/babyDollEyes';
import * as PerishSong from '../moves/perish_song';
import * as Attract from '../moves/attract';
import * as Swagger from '../moves/swagger';
import * as Flatter from '../moves/flatter';
import * as Yawn from '../moves/yawn';
import * as Taunt from '../moves/taunt';
import * as Torment from '../moves/torment';
import * as Encore from '../moves/encore';
import * as Disable from '../moves/disable';
import * as Substitute from '../moves/substitute';
import * as Protect from '../moves/protect';
import * as Endure from '../moves/endure';
import * as QuickGuard from '../moves/quickGuard';
import * as Roar from '../moves/roar';
import * as Telekinesis from '../moves/telekinesis';
import * as MagnetRise from '../moves/magnetRise';
import * as MagneticFlux from '../moves/magneticFlux';
import * as StrengthSap from '../moves/strengthSap';
import * as HealBlock from '../moves/healBlock';
import * as MagicCoat from '../moves/magicCoat';
import * as Trick from '../moves/trick';
import * as Haze from '../moves/haze';
import * as Defog from '../moves/defog';
import * as PsychUp from '../moves/psychUp';
import * as PainSplit from '../moves/painSplit';
import * as SkillSwap from '../moves/skillSwap';
import * as Entrainment from '../moves/entrainment';
import * as SimpleBeam from '../moves/simpleBeam';
import * as WorrySeed from '../moves/worrySeed';
import * as RolePlay from '../moves/rolePlay';
import * as GastroAcid from '../moves/gastroAcid';
import * as TransformMove from '../moves/transform';
import * as Curse from '../moves/curse';
import * as Ingrain from '../moves/ingrain';
import * as AquaRing from '../moves/aquaRing';
import * as Embargo from '../moves/embargo';
import * as Spite from '../moves/spite';
import * as Nightmare from '../moves/nightmare';
import * as Wish from '../moves/wish';
import * as RagePowder from '../moves/ragePowder';
import * as HelpingHand from '../moves/helpingHand';
import * as BatonPass from '../moves/batonPass';
import * as Tailwind from '../moves/tailwind';
import * as Recycle from '../moves/recycle';
import * as Copycat from '../moves/copycat';
import * as Mimic from '../moves/mimic';
import * as Sketch from '../moves/sketch';
import * as Splash from '../moves/splash';
import * as Rest from '../moves/rest';
import * as Soak from '../moves/soak';
import * as AromaticMist from '../moves/aromaticMist';
import * as Acupressure from '../moves/acupressure';
import * as LaserFocus from '../moves/laserFocus';
import * as MindReader from '../moves/mindReader';
import * as CottonGuard from '../moves/cottonGuard';
import * as Autotomize from '../moves/autotomize';
import * as ShiftGear from '../moves/shiftGear';
import * as WorkUp from '../moves/workUp';
import * as BulkUp from '../moves/bulkUp';
import * as CalmMind from '../moves/calmMind';
import * as Amnesia from '../moves/amnesia';
import * as Growth from '../moves/growth';
import * as TailGlow from '../moves/tailGlow';
import * as HealBell from '../moves/healBell';
import * as Aromatherapy from '../moves/aromatherapy';
import * as Tickle from '../moves/tickle';
import * as NobleRoar from '../moves/nobleRoar';
import * as PlayNice from '../moves/playNice';
import * as TearfulLook from '../moves/tearfulLook';
import * as Confide from '../moves/confide';
import * as SweetScent from '../moves/sweetScent';
import * as Charm from '../moves/charm';
import * as Captivate from '../moves/captivate';
import * as EerieImpulse from '../moves/eerieImpulse';
import * as FeatherDance from '../moves/featherDance';
import * as Flash from '../moves/flash';
import * as DefenseCurl from '../moves/defenseCurl';
import * as Harden from '../moves/harden';
import * as Withdraw from '../moves/withdraw';
import * as FocusEnergy from '../moves/focusEnergy';
import * as StuffCheeks from '../moves/stuffCheeks';
import * as ElectricTerrain from '../moves/electricTerrain';
import * as GrassyTerrain from '../moves/grassyTerrain';
import * as MistyTerrain from '../moves/mistyTerrain';
import * as PsychicTerrain from '../moves/psychicTerrain';
import * as AllySwitch from '../moves/allySwitch';
import * as AfterYou from '../moves/afterYou';
import * as Quash from '../moves/quash';
import * as ToxicThread from '../moves/toxicThread';
import * as Bestow from '../moves/bestow';
import * as CorrosiveGas from '../moves/corrosiveGas';
import * as MudSport from '../moves/mudSport';
import * as WaterSport from '../moves/waterSport';
import * as Grudge from '../moves/grudge';
import * as GuardSplit from '../moves/guardSplit';
import * as GuardSwap from '../moves/guardSwap';
import * as PowerSwap from '../moves/powerSwap';
import * as VenomDrench from '../moves/venomDrench';
import * as Snowscape from '../moves/snowscape';
import * as SpeedSwap from '../moves/speedSwap';
import * as AcidArmor from '../moves/acidArmor';
import * as DragonCheer from '../moves/dragonCheer';
import * as TrickOrTreat from '../moves/trickOrTreat';
import * as Refresh from '../moves/refresh';
import * as HoneClaws from '../moves/honeClaws';
import * as Howl from '../moves/howl';
import * as MilkDrink from '../moves/milkDrink';
import * as Coaching from '../moves/coaching';
import * as IonDeluge from '../moves/ionDeluge';

// Generic Handlers
import * as StatusConditions from './statusConditions';
import * as FieldEffects from './fieldEffects';
import * as UniqueEffects from './uniqueEffects';
import * as StatChanges from './statChanges';
import * as VolatileStatus from './volatileStatus';

export function handleStatusMove(
    state: BattleState,
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    logs: LogEntry[]
): { switchRequested?: boolean, defenderSwitchRequested?: boolean, isBatonPass?: boolean } {
    
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    switch(move.name) {
        case 'snatch': Snatch.handleSnatch(attacker, logs); return {};
        case 'sand-attack': SandAttack.handleSandAttack(attacker, defender, logs, state, ignoresAbilities); return {};
        case 'baby-doll-eyes': BabyDollEyes.handleBabyDollEyes(attacker, defender, logs, state); return {};
        case 'perish-song': PerishSong.handlePerishSongStart(attacker, logs, state); return {};
        case 'attract': Attract.handleAttract(attacker, defender, logs, state); return {};
        case 'swagger': Swagger.handleSwagger(attacker, defender, logs, state); return {};
        case 'flatter': Flatter.handleFlatter(attacker, defender, logs, state); return {};
        case 'yawn': Yawn.handleYawn(attacker, defender, logs, state); return {};
        case 'taunt': Taunt.handleTaunt(attacker, defender, logs); return {};
        case 'torment': Torment.handleTorment(attacker, defender, logs); return {};
        case 'encore': Encore.handleEncore(attacker, defender, logs); return {};
        case 'disable': Disable.handleDisable(attacker, defender, logs); return {};
        case 'substitute': Substitute.handleSubstitute(attacker, logs, state); return {};
        case 'protect': 
        case 'detect':
        case 'spiky-shield':
        case 'kings-shield':
        case 'baneful-bunker':
        case 'obstruct':
        case 'silk-trap':
        case 'burning-bulwark':
        case 'crafty-shield':
            Protect.handleProtect(attacker, logs, move.name); return {};
        case 'endure':
            Endure.handleEndure(attacker, logs); return {};
        case 'quick-guard': QuickGuard.handleQuickGuard(attacker, logs); return {};
        case 'roar': 
        case 'whirlwind': 
            Roar.handleRoar(attacker, defender, logs, state); 
            return { defenderSwitchRequested: true };
        case 'telekinesis': Telekinesis.handleTelekinesis(attacker, defender, logs, state); return {};
        case 'magnet-rise': MagnetRise.handleMagnetRise(attacker, logs, state); return {};
        case 'magnetic-flux': MagneticFlux.handleMagneticFlux(attacker, logs, state); return {};
        case 'strength-sap': StrengthSap.handleStrengthSap(attacker, defender, logs, state); return {};
        case 'heal-block': HealBlock.handleHealBlock(attacker, defender, logs); return {};
        case 'magic-coat': MagicCoat.handleMagicCoat(attacker, logs); return {};
        case 'trick': 
        case 'switcheroo':
            Trick.handleTrick(attacker, defender, logs, state); return {};
        case 'haze': Haze.handleHaze(state, logs); return {};
        case 'defog': Defog.handleDefog(attacker, defender, logs, state); return {};
        case 'psych-up': PsychUp.handlePsychUp(attacker, defender, logs); return {};
        case 'pain-split': PainSplit.handlePainSplit(attacker, defender, logs); return {};
        case 'skill-swap': SkillSwap.handleSkillSwap(attacker, defender, logs); return {};
        case 'entrainment': Entrainment.handleEntrainment(attacker, defender, logs); return {};
        case 'simple-beam': SimpleBeam.handleSimpleBeam(attacker, defender, logs); return {};
        case 'worry-seed': WorrySeed.handleWorrySeed(attacker, defender, logs); return {};
        case 'role-play': RolePlay.handleRolePlay(attacker, defender, logs); return {};
        case 'gastro-acid': GastroAcid.handleGastroAcid(attacker, defender, logs); return {};
        case 'transform': TransformMove.executeTransform(attacker, defender, logs); return {};
        case 'curse': Curse.handleCurse(attacker, defender, logs, state); return {};
        case 'leech-seed': VolatileStatus.handleVolatileStatus(attacker, defender, move, 'leech-seed', logs, state); return {};
        case 'ingrain': Ingrain.handleIngrain(attacker, logs); return {};
        case 'aqua-ring': AquaRing.handleAquaRing(attacker, logs); return {};
        case 'embargo': Embargo.handleEmbargo(attacker, defender, logs); return {};
        case 'spite': Spite.handleSpite(attacker, defender, logs); return {};
        case 'nightmare': Nightmare.handleNightmare(attacker, defender, logs); return {};
        case 'wish': Wish.handleWishStart(attacker, logs); return {};
        case 'rage-powder':
        case 'follow-me':
            RagePowder.handleRagePowder(attacker, logs); return {};
        case 'helping-hand': HelpingHand.handleHelpingHand(attacker, logs); return {};
        case 'baton-pass': return BatonPass.handleBatonPass(attacker, logs, state);
        case 'tailwind': Tailwind.handleTailwind(attacker, logs, state); return {};
        case 'recycle': Recycle.handleRecycle(attacker, logs); return {};
        case 'copycat': 
             // Copycat calls executeMove internally which handles logic
             Copycat.handleCopycat(attacker, defender, logs); return {};
        case 'mimic': Mimic.handleMimic(attacker, defender, logs); return {};
        case 'sketch': Sketch.handleSketch(attacker, defender, logs); return {};
        case 'splash': Splash.handleSplash(attacker, logs); return {};
        case 'rest': Rest.handleRest(attacker, logs, state); return {};
        case 'soak': Soak.handleSoak(attacker, defender, logs); return {};
        case 'aromatic-mist': AromaticMist.handleAromaticMist(attacker, logs, state); return {};
        case 'acupressure': Acupressure.handleAcupressure(attacker, logs, state); return {};
        case 'laser-focus': LaserFocus.handleLaserFocus(attacker, logs); return {};
        case 'mind-reader': 
        case 'lock-on':
            MindReader.handleMindReader(attacker, defender, logs); return {};
        case 'cotton-guard': CottonGuard.handleCottonGuard(attacker, logs, state); return {};
        case 'autotomize': Autotomize.handleAutotomize(attacker, logs, state); return {};
        case 'shift-gear': ShiftGear.handleShiftGear(attacker, logs, state); return {};
        case 'work-up': WorkUp.handleWorkUp(attacker, logs, state); return {};
        case 'bulk-up': BulkUp.handleBulkUp(attacker, logs, state); return {};
        case 'calm-mind': CalmMind.handleCalmMind(attacker, logs, state); return {};
        case 'amnesia': Amnesia.handleAmnesia(attacker, logs, state); return {};
        case 'growth': Growth.handleGrowth(attacker, logs, state); return {};
        case 'tail-glow': TailGlow.handleTailGlow(attacker, logs, state); return {};
        case 'heal-bell': HealBell.handleHealBell(attacker, logs, state); return {};
        case 'aromatherapy': Aromatherapy.handleAromatherapy(attacker, logs, state); return {};
        case 'tickle': Tickle.handleTickle(attacker, defender, logs, state); return {};
        case 'noble-roar': NobleRoar.handleNobleRoar(attacker, defender, logs, state); return {};
        case 'play-nice': PlayNice.handlePlayNice(attacker, defender, logs, state); return {};
        case 'tearful-look': TearfulLook.handleTearfulLook(attacker, defender, logs, state); return {};
        case 'confide': Confide.handleConfide(attacker, defender, logs, state); return {};
        case 'sweet-scent': SweetScent.handleSweetScent(attacker, defender, logs, state); return {};
        case 'charm': Charm.handleCharm(attacker, defender, logs, state); return {};
        case 'captivate': Captivate.handleCaptivate(attacker, defender, logs, state); return {};
        case 'eerie-impulse': EerieImpulse.handleEerieImpulse(attacker, defender, logs, state); return {};
        case 'feather-dance': FeatherDance.handleFeatherDance(attacker, defender, logs, state); return {};
        case 'flash': Flash.handleFlash(attacker, defender, logs, state); return {};
        case 'defense-curl': DefenseCurl.handleDefenseCurl(attacker, logs, state); return {};
        case 'harden': Harden.handleHarden(attacker, logs, state); return {};
        case 'withdraw': Withdraw.handleWithdraw(attacker, logs, state); return {};
        case 'focus-energy': FocusEnergy.handleFocusEnergy(attacker, logs); return {};
        case 'stuff-cheeks': StuffCheeks.handleStuffCheeks(attacker, logs, state); return {};
        case 'electric-terrain': ElectricTerrain.handleElectricTerrain(state, logs, attacker); return {};
        case 'grassy-terrain': GrassyTerrain.handleGrassyTerrain(state, logs, attacker); return {};
        case 'misty-terrain': MistyTerrain.handleMistyTerrain(state, logs, attacker); return {};
        case 'psychic-terrain': PsychicTerrain.handlePsychicTerrain(state, logs, attacker); return {};
        case 'ally-switch': AllySwitch.handleAllySwitch(attacker, logs, state); return {};
        case 'after-you': AfterYou.handleAfterYou(attacker, defender, logs); return {};
        case 'quash': Quash.handleQuash(attacker, defender, logs); return {};
        case 'toxic-thread': ToxicThread.handleToxicThread(attacker, defender, logs, state); return {};
        case 'bestow': Bestow.handleBestow(attacker, defender, logs, state); return {};
        case 'corrosive-gas': CorrosiveGas.handleCorrosiveGas(attacker, defender, logs, state); return {};
        case 'mud-sport': MudSport.handleMudSport(state, logs); return {};
        case 'water-sport': WaterSport.handleWaterSport(state, logs); return {};
        case 'grudge': Grudge.handleGrudge(attacker, logs); return {};
        case 'guard-split': GuardSplit.handleGuardSplit(attacker, defender, logs); return {};
        case 'guard-swap': GuardSwap.handleGuardSwap(attacker, defender, logs); return {};
        case 'power-swap': PowerSwap.handlePowerSwap(attacker, defender, logs); return {};
        case 'venom-drench': VenomDrench.handleVenomDrench(attacker, defender, logs, state); return {};
        case 'snowscape': Snowscape.handleSnowscape(state, logs, attacker); return {};
        case 'reflect-type': ReflectType.handleReflectType(attacker, defender, logs); return {};
        case 'wonder-room': WonderRoom.handleWonderRoom(state, logs); return {};
        case 'magic-room': MagicRoom.handleMagicRoom(state, logs); return {};
        case 'life-dew': LifeDew.handleLifeDew(attacker, logs, state); return {};
        case 'slack-off': SlackOff.handleSlackOff(attacker, move, logs, state); return {};
        case 'speed-swap': SpeedSwap.handleSpeedSwap(attacker, defender, logs); return {};
        case 'acid-armor': AcidArmor.handleAcidArmor(attacker, logs, state); return {};
        case 'dragon-cheer': DragonCheer.handleDragonCheer(attacker, logs); return {};
        case 'trick-or-treat': TrickOrTreat.handleTrickOrTreat(attacker, defender, logs); return {};
        case 'refresh': Refresh.handleRefresh(attacker, logs); return {};
        case 'hone-claws': HoneClaws.handleHoneClaws(attacker, logs, state); return {};
        case 'howl': Howl.handleHowl(attacker, logs, state); return {};
        case 'milk-drink': MilkDrink.handleMilkDrink(attacker, logs, state); return {};
        case 'coaching': Coaching.handleCoaching(attacker, logs, state); return {};
        case 'ion-deluge': IonDeluge.handleIonDeluge(attacker, defender, logs, state); return {};

        default:
            // Fallback to generic handling (status conditions, stat changes, weather, etc)
            if (move.effect) {
                if (move.effect.status === 'weather') FieldEffects.handleFieldMove(state, move, logs);
                else if (move.effect.status === 'heal') UniqueEffects.handleHealingMove(attacker, move, logs, state);
                else if (move.effect.status === 'transform') UniqueEffects.handleTransform(attacker, defender, logs);
                else if (move.effect.status === 'self-faint') UniqueEffects.handleSelfDestruct(attacker, move, logs);
                else if (move.effect.status.includes('-')) {
                    // Stat Changes (up/down)
                    if (move.effect.status.includes('-up')) {
                        // Buff User
                        StatChanges.applyMoveStatChange(attacker, move.effect.status, logs, false, false, move.name, state);
                    } else {
                        // Debuff Target
                        StatChanges.applyMoveStatChange(defender, move.effect.status, logs, true, ignoresAbilities, move.name, state);
                    }
                }
                else {
                    // Status Conditions (Burn, Poison, etc)
                    StatusConditions.applyStatus(defender, move.effect.status, logs, attacker, false, state, move);
                }
            }
            return {};
    }
}
