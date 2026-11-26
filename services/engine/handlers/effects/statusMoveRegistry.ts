import { BattleState, Pokemon, Move, LogEntry } from '../../../../types';
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
import * as Spikes from '../moves/spikes';
import * as StealthRock from '../moves/stealthRock';
import * as StickyWeb from '../moves/stickyWeb';
import * as ToxicSpikes from '../moves/toxicSpikes';
import * as LightScreen from '../moves/lightScreen';
import * as Gravity from '../moves/gravity';
import * as Safeguard from '../moves/safeguard';
import * as Mist from '../moves/mist';
import * as LuckyChant from '../moves/luckyChant';
import * as FieldEffects from './fieldEffects';
import * as VolatileStatus from './volatileStatus';
import { BattlePRNG } from '../../../../utils/prng';

export interface StatusMoveResult {
    switchRequested?: boolean;
    defenderSwitchRequested?: boolean;
    isBatonPass?: boolean;
}

export interface StatusMoveContext {
    state: BattleState;
    attacker: Pokemon;
    defender: Pokemon;
    move: Move;
    logs: LogEntry[];
    ignoresAbilities: boolean;
    prng?: BattlePRNG;
}

export interface StatusMoveRoute {
    names: readonly string[];
    handler: unknown;
    execute: (context: StatusMoveContext) => StatusMoveResult;
}

const defineStatusMoveRoute = <Handler>(
    names: readonly string[],
    handler: Handler,
    invoke: (handler: Handler, context: StatusMoveContext) => StatusMoveResult | void,
): StatusMoveRoute => ({
    names,
    handler,
    execute: context => {
        const result = invoke(handler, context) as StatusMoveResult | undefined;
        return result ?? {};
    },
});

export const STATUS_MOVE_REGISTRY: readonly StatusMoveRoute[] = [
    defineStatusMoveRoute(
        ['snatch'],
        Snatch.handleSnatch,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['sand-attack'],
        SandAttack.handleSandAttack,
        (handler, { state, attacker, defender, logs, ignoresAbilities }) => {
            handler(attacker, defender, logs, state, ignoresAbilities);
        },
    ),

    defineStatusMoveRoute(
        ['baby-doll-eyes'],
        BabyDollEyes.handleBabyDollEyes,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['perish-song'],
        PerishSong.handlePerishSongStart,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['attract'],
        Attract.handleAttract,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['swagger'],
        Swagger.handleSwagger,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['flatter'],
        Flatter.handleFlatter,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['yawn'],
        Yawn.handleYawn,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['taunt'],
        Taunt.handleTaunt,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['torment'],
        Torment.handleTorment,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['encore'],
        Encore.handleEncore,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['disable'],
        Disable.handleDisable,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['substitute'],
        Substitute.handleSubstitute,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        [
            'protect',
            'detect',
            'spiky-shield',
            'kings-shield',
            'baneful-bunker',
            'obstruct',
            'silk-trap',
            'burning-bulwark',
            'crafty-shield',
        ],
        Protect.handleProtect,
        (handler, { attacker, move, logs, prng }) => {
            handler(attacker, logs, move.name, prng);
        },
    ),

    defineStatusMoveRoute(
        ['endure'],
        Endure.handleEndure,
        (handler, { attacker, logs, prng }) => {
            handler(attacker, logs, prng);
        },
    ),

    defineStatusMoveRoute(
        ['quick-guard'],
        QuickGuard.handleQuickGuard,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['roar', 'whirlwind'],
        Roar.handleRoar,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
            return { defenderSwitchRequested: true };
        },
    ),

    defineStatusMoveRoute(
        ['telekinesis'],
        Telekinesis.handleTelekinesis,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['magnet-rise'],
        MagnetRise.handleMagnetRise,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['magnetic-flux'],
        MagneticFlux.handleMagneticFlux,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['strength-sap'],
        StrengthSap.handleStrengthSap,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['heal-block'],
        HealBlock.handleHealBlock,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['magic-coat'],
        MagicCoat.handleMagicCoat,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['trick', 'switcheroo'],
        Trick.handleTrick,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['haze'],
        Haze.handleHaze,
        (handler, { state, logs }) => {
            handler(state, logs);
        },
    ),

    defineStatusMoveRoute(
        ['defog'],
        Defog.handleDefog,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['psych-up'],
        PsychUp.handlePsychUp,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['pain-split'],
        PainSplit.handlePainSplit,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['skill-swap'],
        SkillSwap.handleSkillSwap,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['entrainment'],
        Entrainment.handleEntrainment,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['simple-beam'],
        SimpleBeam.handleSimpleBeam,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['worry-seed'],
        WorrySeed.handleWorrySeed,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['role-play'],
        RolePlay.handleRolePlay,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['gastro-acid'],
        GastroAcid.handleGastroAcid,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['transform'],
        TransformMove.executeTransform,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['curse'],
        Curse.handleCurse,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['leech-seed'],
        VolatileStatus.handleVolatileStatus,
        (handler, { state, attacker, defender, move, logs, prng }) => {
            handler(attacker, defender, move, 'leech-seed', logs, state, prng);
        },
    ),

    defineStatusMoveRoute(
        ['ingrain'],
        Ingrain.handleIngrain,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['aqua-ring'],
        AquaRing.handleAquaRing,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['embargo'],
        Embargo.handleEmbargo,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['spite'],
        Spite.handleSpite,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['nightmare'],
        Nightmare.handleNightmare,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['wish'],
        Wish.handleWishStart,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['rage-powder', 'follow-me'],
        RagePowder.handleRagePowder,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['helping-hand'],
        HelpingHand.handleHelpingHand,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['baton-pass'],
        BatonPass.handleBatonPass,
        (handler, { state, attacker, logs }) => handler(attacker, logs, state),
    ),

    defineStatusMoveRoute(
        ['tailwind'],
        Tailwind.handleTailwind,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['recycle'],
        Recycle.handleRecycle,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['copycat'],
        Copycat.handleCopycat,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['mimic'],
        Mimic.handleMimic,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['sketch'],
        Sketch.handleSketch,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['splash'],
        Splash.handleSplash,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['rest'],
        Rest.handleRest,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['soak'],
        Soak.handleSoak,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['aromatic-mist'],
        AromaticMist.handleAromaticMist,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['acupressure'],
        Acupressure.handleAcupressure,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['laser-focus'],
        LaserFocus.handleLaserFocus,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['mind-reader', 'lock-on'],
        MindReader.handleMindReader,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['cotton-guard'],
        CottonGuard.handleCottonGuard,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['autotomize'],
        Autotomize.handleAutotomize,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['shift-gear'],
        ShiftGear.handleShiftGear,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['work-up'],
        WorkUp.handleWorkUp,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['bulk-up'],
        BulkUp.handleBulkUp,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['calm-mind'],
        CalmMind.handleCalmMind,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['amnesia'],
        Amnesia.handleAmnesia,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['growth'],
        Growth.handleGrowth,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['tail-glow'],
        TailGlow.handleTailGlow,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['heal-bell'],
        HealBell.handleHealBell,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['aromatherapy'],
        Aromatherapy.handleAromatherapy,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['tickle'],
        Tickle.handleTickle,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['noble-roar'],
        NobleRoar.handleNobleRoar,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['play-nice'],
        PlayNice.handlePlayNice,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['tearful-look'],
        TearfulLook.handleTearfulLook,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['confide'],
        Confide.handleConfide,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['sweet-scent'],
        SweetScent.handleSweetScent,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['charm'],
        Charm.handleCharm,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['captivate'],
        Captivate.handleCaptivate,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['eerie-impulse'],
        EerieImpulse.handleEerieImpulse,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['feather-dance'],
        FeatherDance.handleFeatherDance,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['flash'],
        Flash.handleFlash,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['defense-curl'],
        DefenseCurl.handleDefenseCurl,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['harden'],
        Harden.handleHarden,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['withdraw'],
        Withdraw.handleWithdraw,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['focus-energy'],
        FocusEnergy.handleFocusEnergy,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['stuff-cheeks'],
        StuffCheeks.handleStuffCheeks,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['electric-terrain'],
        ElectricTerrain.handleElectricTerrain,
        (handler, { state, attacker, logs }) => {
            handler(state, logs, attacker);
        },
    ),

    defineStatusMoveRoute(
        ['grassy-terrain'],
        GrassyTerrain.handleGrassyTerrain,
        (handler, { state, attacker, logs }) => {
            handler(state, logs, attacker);
        },
    ),

    defineStatusMoveRoute(
        ['misty-terrain'],
        MistyTerrain.handleMistyTerrain,
        (handler, { state, attacker, logs }) => {
            handler(state, logs, attacker);
        },
    ),

    defineStatusMoveRoute(
        ['psychic-terrain'],
        PsychicTerrain.handlePsychicTerrain,
        (handler, { state, attacker, logs }) => {
            handler(state, logs, attacker);
        },
    ),

    defineStatusMoveRoute(
        ['ally-switch'],
        AllySwitch.handleAllySwitch,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['after-you'],
        AfterYou.handleAfterYou,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['quash'],
        Quash.handleQuash,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['toxic-thread'],
        ToxicThread.handleToxicThread,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['bestow'],
        Bestow.handleBestow,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['corrosive-gas'],
        CorrosiveGas.handleCorrosiveGas,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['mud-sport'],
        MudSport.handleMudSport,
        (handler, { state, logs }) => {
            handler(state, logs);
        },
    ),

    defineStatusMoveRoute(
        ['water-sport'],
        WaterSport.handleWaterSport,
        (handler, { state, logs }) => {
            handler(state, logs);
        },
    ),

    defineStatusMoveRoute(
        ['grudge'],
        Grudge.handleGrudge,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['guard-split'],
        GuardSplit.handleGuardSplit,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['guard-swap'],
        GuardSwap.handleGuardSwap,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['power-swap'],
        PowerSwap.handlePowerSwap,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['venom-drench'],
        VenomDrench.handleVenomDrench,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['snowscape'],
        Snowscape.handleSnowscape,
        (handler, { state, attacker, logs }) => {
            handler(state, logs, attacker);
        },
    ),

    defineStatusMoveRoute(
        ['reflect-type'],
        ReflectType.handleReflectType,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['wonder-room'],
        WonderRoom.handleWonderRoom,
        (handler, { state, logs }) => {
            handler(state, logs);
        },
    ),

    defineStatusMoveRoute(
        ['magic-room'],
        MagicRoom.handleMagicRoom,
        (handler, { state, logs }) => {
            handler(state, logs);
        },
    ),

    defineStatusMoveRoute(
        ['life-dew'],
        LifeDew.handleLifeDew,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['slack-off'],
        SlackOff.handleSlackOff,
        (handler, { state, attacker, move, logs }) => {
            handler(attacker, move, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['speed-swap'],
        SpeedSwap.handleSpeedSwap,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['acid-armor'],
        AcidArmor.handleAcidArmor,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['dragon-cheer'],
        DragonCheer.handleDragonCheer,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['trick-or-treat'],
        TrickOrTreat.handleTrickOrTreat,
        (handler, { attacker, defender, logs }) => {
            handler(attacker, defender, logs);
        },
    ),

    defineStatusMoveRoute(
        ['refresh'],
        Refresh.handleRefresh,
        (handler, { attacker, logs }) => {
            handler(attacker, logs);
        },
    ),

    defineStatusMoveRoute(
        ['hone-claws'],
        HoneClaws.handleHoneClaws,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['howl'],
        Howl.handleHowl,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['milk-drink'],
        MilkDrink.handleMilkDrink,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['coaching'],
        Coaching.handleCoaching,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['ion-deluge'],
        IonDeluge.handleIonDeluge,
        (handler, { state, attacker, defender, logs }) => {
            handler(attacker, defender, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['spikes'],
        Spikes.handleSpikes,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['stealth-rock'],
        StealthRock.handleStealthRock,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['sticky-web'],
        StickyWeb.handleStickyWeb,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['toxic-spikes'],
        ToxicSpikes.handleToxicSpikes,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['reflect', 'aurora-veil'],
        FieldEffects.handleScreens,
        (handler, { state, attacker, move, logs }) => {
            handler(state, attacker, move, logs);
        },
    ),

    defineStatusMoveRoute(
        ['light-screen'],
        LightScreen.handleLightScreen,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['trick-room'],
        FieldEffects.handleFieldMove,
        (handler, { state, move, logs }) => {
            handler(state, move, logs);
        },
    ),

    defineStatusMoveRoute(
        ['gravity'],
        Gravity.handleGravity,
        (handler, { state, logs }) => {
            handler(state, logs);
        },
    ),

    defineStatusMoveRoute(
        ['safeguard'],
        Safeguard.handleSafeguard,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['mist'],
        Mist.handleMist,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),

    defineStatusMoveRoute(
        ['lucky-chant'],
        LuckyChant.handleLuckyChant,
        (handler, { state, attacker, logs }) => {
            handler(attacker, logs, state);
        },
    ),
];

const STATUS_MOVE_LOOKUP = new Map<string, StatusMoveRoute>();
for (const route of STATUS_MOVE_REGISTRY) {
    for (const name of route.names) {
        if (!name.trim() || STATUS_MOVE_LOOKUP.has(name)) {
            throw new Error(`Registro de golpe de status inválido ou duplicado: ${name}`);
        }
        STATUS_MOVE_LOOKUP.set(name, route);
    }
}

export const getStatusMoveRoute = (name: string): StatusMoveRoute | undefined =>
    STATUS_MOVE_LOOKUP.get(name);
