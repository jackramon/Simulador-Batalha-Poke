
import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as Overcoat from '../abilities/overcoat';
import * as ShieldDust from '../abilities/shield_dust';
import * as SuctionCups from '../abilities/suction_cups';
import * as InnerFocus from '../abilities/inner_focus';
import * as Stench from '../abilities/stench';
import * as SheerForce from '../abilities/sheer_force';

// Import Handlers
import * as VolatileStatus from './volatileStatus';
import * as StatChanges from './statChanges';
import * as DamageEvents from './damageEvents';
import * as Unique from './uniqueEffects';
import * as FieldEffects from './fieldEffects';
import * as StatusConditions from './statusConditions';
import * as PartialTrapping from '../moves/partialTrapping';

// Move specific imports
import * as FutureSight from '../moves/futureSight';
import * as DoomDesire from '../moves/doomDesire';
import * as Rollout from '../moves/rollout';
import * as Stomp from '../moves/stomp';
import * as ScaleShot from '../moves/scaleShot';
import * as Outrage from '../moves/outrage';
import * as BugBite from '../moves/bugBite';
import * as ScreenBreak from '../moves/screenBreak';
import * as FuryCutter from '../moves/furyCutter';
import * as EchoedVoice from '../moves/echoedVoice';
import * as SecretPower from '../moves/secretPower';
import * as RapidSpin from '../moves/rapidSpin';
import * as Uproar from '../moves/uproar';
import * as Thief from '../moves/thief';
import * as Rage from '../moves/rage';
import * as ThroatChop from '../moves/throatChop';
import * as SteelRoller from '../moves/steelRoller';
import * as IceSpinner from '../moves/iceSpinner';
import * as PowderSnow from '../moves/powderSnow';
import * as KnockOff from '../moves/knockOff';
import * as WakeUpSlap from '../moves/wakeUpSlap';
import * as ClearSmog from '../moves/clearSmog';
import * as BurningJealousy from '../moves/burningJealousy';
import * as BreakingSwipe from '../moves/breakingSwipe';
import * as ScorchingSands from '../moves/scorchingSands';
import * as Superpower from '../moves/superpower';
import * as DragonTail from '../moves/dragonTail';
import * as AlluringVoice from '../moves/alluringVoice';
import * as CloseCombat from '../moves/closeCombat';
import * as PsychicNoise from '../moves/psychicNoise';
import * as Trailblaze from '../moves/trailblaze';
import * as Incinerate from '../moves/incinerate';
import * as SmellingSalts from '../moves/smellingSalts';
import * as HeadlongRush from '../moves/headlongRush';
import * as TriAttack from '../moves/triAttack';
import * as FireFang from '../moves/fireFang';
import * as PetalDance from '../moves/petalDance';
import * as StruggleBug from '../moves/struggleBug';
import * as ZapCannon from '../moves/zapCannon';
import * as Discharge from '../moves/discharge';
import * as ThousandWaves from '../moves/thousandWaves';
import * as Thrash from '../moves/thrash';
import * as GlaiveRush from '../moves/glaiveRush';
import * as LeafTornado from '../moves/leafTornado';
import * as CoreEnforcer from '../moves/coreEnforcer';
import * as HammerArm from '../moves/hammerArm';
import * as BurnUp from '../moves/burnUp';
import * as DrumBeating from '../moves/drumBeating';
import * as RelicSong from '../moves/relicSong';
import * as SaltCure from '../moves/saltCure';
import * as DoubleShock from '../moves/doubleShock';
import * as AuroraBeam from '../moves/auroraBeam';
import * as Fling from '../moves/fling';
import * as TropKick from '../moves/tropKick';
import * as SyrupBomb from '../moves/syrupBomb';
import * as MistBall from '../moves/mistBall';
import * as FireLash from '../moves/fireLash';
import * as BlueFlare from '../moves/blueFlare';
import * as BoltStrike from '../moves/boltStrike';
import * as DizzyPunch from '../moves/dizzyPunch';
import * as SpitUp from '../moves/spitUp';
import * as DragonAscent from '../moves/dragonAscent';
import * as LavaPlume from '../moves/lavaPlume';
import * as StrangeSteam from '../moves/strangeSteam';
import * as IceBurn from '../moves/iceBurn';
import * as SludgeWave from '../moves/sludgeWave';
import * as Headbutt from '../moves/headbutt';
import * as AncientPower from '../moves/ancientPower';
import * as DynamicPunch from '../moves/dynamicPunch';
import * as AirSlash from '../moves/airSlash';
import * as Constrict from '../moves/constrict';
import * as Lick from '../moves/lick';
import * as ChillingWater from '../moves/chillingWater';
import * as RagingFury from '../moves/ragingFury';
import * as Bubble from '../moves/bubble';
import * as BubbleBeam from '../moves/bubbleBeam';
import * as Bind from '../moves/bind';
import * as StoneAxe from '../moves/stoneAxe';
import * as SpringtideStorm from '../moves/springtideStorm';
import * as SteamEruption from '../moves/steamEruption';
import * as BlazeKick from '../moves/blazeKick';
import * as PlasmaFists from '../moves/plasmaFists';
import * as SeedFlare from '../moves/seedFlare';
import * as FleurCannon from '../moves/fleurCannon';
import * as SandsearStorm from '../moves/sandsearStorm';

import { PARTIAL_TRAPPING_MOVES } from '../../../../data/moves/categories';

export function handleSecondaryEffects(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    logs: LogEntry[], 
    state?: BattleState,
    hitSubstituteOnLastHit?: boolean
): { defenderSwitchRequested?: boolean } {
  
  if (['dragon-tail', 'circle-throw'].includes(move.name) || move.effect?.status === 'force-switch') {
      const isP1 = state?.currentPokemon1?.id === attacker.id;
      // Note: handleForceSwitch returns true if a switch was requested
      if (!hitSubstituteOnLastHit) {
          DragonTail.handleForceSwitch(attacker, defender, logs, move.name, state);
      }
      return {}; 
  }

  // 1. Relic Song Form Change (Always happens if hit)
  if (move.name === 'relic-song') {
      RelicSong.handleFormChange(attacker, logs);
  }

  if (SheerForce.shouldBlockSecondaryEffects(attacker, move)) {
      return {};
  }

  if (move.name === 'springtide-storm') {
      if (!hitSubstituteOnLastHit) {
          SpringtideStorm.handleSpringtideStormEffect(attacker, defender, logs, state);
      }
      return {};
  }
  
  const chance = (move.effect?.chance || 0) * (attacker.ability === 'serene-grace' ? 2 : 1);
  const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);
  const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;

  // Efeitos que SEMPRE acontecem se o golpe acertar (e não são bloqueados por Shield Dust)
  // Spit Up consome a estocagem independentemente do alvo
  if (move.effect?.status === 'spit-up-effect') {
      SpitUp.handleSpitUpEffect(attacker, logs);
      return {};
  }

  if (Overcoat.blocksMove(defender, move, ignoresAbilities)) {
      return {};
  }

  if (ShieldDust.blocksSecondaryEffects(defender, ignoresAbilities)) {
      log(logs, `${defender.name} está protegido de efeitos adicionais por seu Pó de Escudo!`, 'text-gray-500 italic text-[10px]');
      return {};
  }

  if (move.effect?.status === 'future-sight') {
      FutureSight.handleFutureSightStart(attacker, defender, logs, state);
      return {};
  }
  if (move.effect?.status === 'doom-desire') {
      DoomDesire.handleDoomDesireStart(attacker, defender, logs, state);
      return {};
  }
  if (move.effect?.status === 'always-crit') return {};
  if (move.effect?.status === 'high-crit') return {}; // Ignora processamento de status para moves de crit
  if (move.effect?.status === 'rollout-lock') {
      Rollout.handleRolloutLock(attacker, logs);
      return {};
  }

  // Se atingiu o substitute, os efeitos secundários que afetam o defensor são bloqueados
  if (hitSubstituteOnLastHit) {
      // Efeitos que afetam o atacante ainda acontecem
      if (move.effect?.status === 'self-attack-up') {
          StatChanges.applyMoveStatChange(attacker, 'attack-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-defense-up') {
          StatChanges.applyMoveStatChange(attacker, 'defense-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-speed-up') {
          StatChanges.applyMoveStatChange(attacker, 'speed-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-spAttack-up') {
          StatChanges.applyMoveStatChange(attacker, 'spAttack-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-spDefense-up') {
          StatChanges.applyMoveStatChange(attacker, 'spDefense-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-evasion-up') {
          StatChanges.applyMoveStatChange(attacker, 'evasion-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'all-stats-up') {
          StatChanges.handleAllStatsUp(attacker, logs, state);
      } else if (move.effect?.status === 'self-defense-up-2') {
          StatChanges.applyMoveStatChange(attacker, 'defense-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'defense-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-spAttack-up-2') {
          StatChanges.applyMoveStatChange(attacker, 'spAttack-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'spAttack-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-speed-up-2') {
          StatChanges.applyMoveStatChange(attacker, 'speed-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'speed-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-attack-up-2') {
          StatChanges.applyMoveStatChange(attacker, 'attack-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'attack-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-attack-spAttack-up') {
          StatChanges.applyMoveStatChange(attacker, 'attack-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'spAttack-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-attack-defense-up') {
          StatChanges.applyMoveStatChange(attacker, 'attack-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'defense-up', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-attack-defense-accuracy-up') {
          StatChanges.applyMoveStatChange(attacker, 'attack-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'defense-up', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'accuracy-up', logs, false, false, move.name, state);
      } else if (move.name === 'scale-shot') {
          ScaleShot.applyScaleShotStats(attacker, logs, state);
      } else if (move.name === 'outrage' || move.name === 'petal-dance' || move.name === 'thrash') {
          // Outrage lock is applied even if it hits substitute
      } else if (move.effect?.status === 'self-defense-spDefense-down') {
          StatChanges.applyMoveStatChange(attacker, 'defense-down', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'spDefense-down', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-attack-defense-down') {
          StatChanges.applyMoveStatChange(attacker, 'attack-down', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'defense-down', logs, false, false, move.name, state);
      } else if (move.name === 'fleur-cannon' || move.effect?.status === 'self-spAttack-down-2') {
          StatChanges.applyMoveStatChange(attacker, 'spAttack-down', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'spAttack-down', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'self-speed-down') {
          StatChanges.applyMoveStatChange(attacker, 'speed-down', logs, false, false, move.name, state);
      } else if (move.effect?.status === 'rapid-spin-effect') {
          RapidSpin.handleRapidSpin(attacker, logs, state);
      } else if (move.effect?.status === 'uproar-start') {
          Uproar.handleUproarStart(attacker, logs);
      } else if (move.effect?.status === 'rage-start') {
          Rage.handleRageStart(attacker, logs);
      }
      return {};
  }

  if (move.effect?.status === 'thunder-fang-effect') {
      const sereneMult = attacker.ability === 'serene-grace' ? 2 : 1;
      if (Math.random() < 0.1 * sereneMult) {
          StatusConditions.applyStatus(defender, 'paralysis', logs, attacker, false, state);
      }
      if (Math.random() < 0.1 * sereneMult) {
          VolatileStatus.handleFlinch(defender, logs, ignoresAbilities);
      }
      return {};
  }

  if (move.effect?.status === 'ice-fang-effect') {
      const sereneMult = attacker.ability === 'serene-grace' ? 2 : 1;
      if (Math.random() < 0.1 * sereneMult) {
          StatusConditions.applyStatus(defender, 'freeze', logs, attacker, false, state);
      }
      if (Math.random() < 0.1 * sereneMult) {
          VolatileStatus.handleFlinch(defender, logs, ignoresAbilities);
      }
      return {};
  }

  if (move.effect?.status === 'fire-fang-effect') {
      FireFang.handleFireFangEffect(attacker, defender, logs, state, ignoresAbilities);
      return {};
  }

  // Fling Effect (Guaranteed if hit and item was consumed)
  if (move.name === 'fling' && attacker.consumedItem) {
      Fling.handleFlingEffect(attacker, defender, attacker.consumedItem, logs, state);
      return {};
  }

  if (Math.random() * 100 < chance) {
      if (PARTIAL_TRAPPING_MOVES.includes(move.name) && move.name !== 'bind') {
          PartialTrapping.applyPartialTrapping(attacker, defender, move, logs);
      }
      else if (move.name === 'ancient-power') {
          AncientPower.handleAncientPowerEffect(attacker, logs, state);
      }
      else if (move.name === 'dynamic-punch') {
          DynamicPunch.handleDynamicPunchEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'trap') {
          ThousandWaves.handleTrapping(defender, logs);
      }
      else if (move.name === 'headbutt') {
          Headbutt.handleHeadbuttEffect(defender, logs, ignoresAbilities);
      }
      else if (move.name === 'sludge-wave') {
          SludgeWave.handleSludgeWaveEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'bolt-strike') {
          BoltStrike.handleBoltStrikeEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'air-slash') {
          AirSlash.handleAirSlashEffect(defender, logs, ignoresAbilities);
      }
      else if (move.effect?.status === 'glaive-rush') {
          GlaiveRush.handleGlaiveRushEffect(attacker, logs);
      }
      else if (move.effect?.status === 'core-enforcer') {
          CoreEnforcer.handleCoreEnforcerEffect(attacker, defender, logs);
      }
      else if (move.effect?.status === 'hammer-arm-drop') {
          HammerArm.handleHammerArmEffect(attacker, logs, state);
      }
      else if (move.name === 'leaf-tornado') {
          LeafTornado.handleLeafTornadoEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'discharge') {
          Discharge.handleDischargeEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'aurora-beam') {
          AuroraBeam.handleAuroraBeamEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'bubble') {
          Bubble.handleBubbleEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'bubble-beam') {
          BubbleBeam.handleBubbleBeamEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'zap-cannon-effect') {
          ZapCannon.handleZapCannonEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'struggle-bug') {
          StruggleBug.handleStruggleBugEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'chilling-water') {
          ChillingWater.handleChillingWaterEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'lava-plume') {
          LavaPlume.handleLavaPlumeEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'blaze-kick') {
          BlazeKick.handleBlazeKickEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'flinch') {
          VolatileStatus.handleFlinch(defender, logs, ignoresAbilities);
      } 
      else if (move.effect?.status === 'tri-attack-effect') {
          TriAttack.handleTriAttackEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'stomp-effect') {
          Stomp.handleStompFlinch(attacker, defender, logs, ignoresAbilities);
      }
      else if (move.name === 'bind') {
          Bind.handleBind(attacker, defender, move, logs, state);
      }
      else if (move.effect?.status === 'burning-jealousy') {
          BurningJealousy.handleBurningJealousy(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'alluring-voice') {
          AlluringVoice.handleAlluringVoice(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'breaking-swipe') {
          BreakingSwipe.handleBreakingSwipeEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'scorching-sands') {
          ScorchingSands.handleScorchingSandsEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'sandsear-storm') {
          SandsearStorm.handleSandsearStormEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'drum-beating') {
          DrumBeating.handleDrumBeatingEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'trop-kick') {
          TropKick.handleTropKickEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'fire-lash') {
          FireLash.handleFireLashEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'superpower-drop') {
          Superpower.handleSuperpowerEffect(attacker, logs, state);
      }
      else if (move.effect?.status === 'close-combat-drop') {
          CloseCombat.handleCloseCombatEffect(attacker, logs, state);
      }
      else if (move.effect?.status === 'headlong-rush-drop') {
          HeadlongRush.handleHeadlongRushEffect(attacker, logs, state);
      }
      else if (move.effect?.status === 'dragon-ascent-drop') {
          DragonAscent.handleDragonAscentEffect(attacker, logs, state);
      }
      else if (move.effect?.status === 'heal-block') {
          PsychicNoise.handlePsychicNoiseEffect(defender, logs);
      }
      else if (move.effect?.status === 'trailblaze-effect') {
          Trailblaze.handleTrailblazeEffect(attacker, logs, state);
      }
      else if (move.effect?.status === 'self-atk-def-down') {
          StatChanges.applyMoveStatChange(attacker, 'attack-down', logs, false, false, move.name, state);
          StatChanges.applyMoveStatChange(attacker, 'defense-down', logs, false, false, move.name, state);
      }
      else if (move.name === 'fleur-cannon') {
          FleurCannon.handleFleurCannonEffect(attacker, logs, state);
      }
      else if (move.effect?.status === 'self-spAttack-down-2') {
          StatChanges.applyMoveStatChange(attacker, 'spAttack-down', logs, false, false, move.name, state);
      }
      else if (move.effect?.status === 'scale-shot-stats') {
          ScaleShot.applyScaleShotStats(attacker, logs, state);
      }
      else if (move.effect?.status === 'outrage-lock') {
          Outrage.processOutrageLock(attacker, logs, state);
      }
      else if (move.effect?.status === 'thrash-lock') {
          Thrash.processThrashLock(attacker, logs, state);
      }
      else if (move.effect?.status === 'petal-dance-lock') {
          PetalDance.processPetalDanceLock(attacker, logs, state);
      }
      else if (move.effect?.status === 'raging-fury-lock') {
          RagingFury.processRagingFuryLock(attacker, logs, state);
      }
      else if (move.effect?.status === 'bug-bite-effect') {
          BugBite.handleBugBiteEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'incinerate-effect') {
          Incinerate.handleIncinerate(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'screen-break') {
          if (state) ScreenBreak.handleScreenBreak(state, defender, logs);
      }
      else if (move.effect?.status === 'fury-cutter-streak') {
          FuryCutter.incrementStreak(attacker, logs);
      }
      else if (move.effect?.status === 'echoed-voice-streak') {
          EchoedVoice.incrementStreak(attacker, logs);
      }
      else if (move.effect?.status === 'secret-power-effect') {
          SecretPower.handleSecretPower(attacker, defender, logs, state, ignoresAbilities);
      }
      else if (move.effect?.status === 'rapid-spin-effect') {
          RapidSpin.handleRapidSpin(attacker, logs, state);
      }
      else if (move.effect?.status === 'all-stats-up') {
          StatChanges.handleAllStatsUp(attacker, logs, state);
      }
      else if (move.effect?.status === 'uproar-start') {
          Uproar.handleUproarStart(attacker, logs);
      }
      else if (move.effect?.status === 'steal-item') {
          Thief.handleItemSteal(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'rage-start') {
          Rage.handleRageStart(attacker, logs);
      }
      else if (move.effect?.status === 'throat-chop') {
          ThroatChop.handleThroatChopEffect(defender, logs);
      }
      else if (move.effect?.status === 'knock-off-effect') {
          KnockOff.handleKnockOffEffect(defender, attacker, logs, state);
      }
      else if (move.effect?.status === 'remove-terrain') {
          if (move.name === 'ice-spinner' && state) {
              IceSpinner.handleIceSpinnerEffect(state, logs);
          } else if (state) {
              SteelRoller.handleTerrainRemoval(state, logs);
          }
      }
      else if (move.name === 'powder-snow' && state) {
          PowderSnow.handlePowderSnowEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'mist-ball-effect') {
          MistBall.handleMistBallEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'wake-up-slap') {
          WakeUpSlap.handleWakeUpEffect(defender, logs);
      }
      else if (move.effect?.status === 'reset-stats') {
          ClearSmog.handleClearSmog(defender, logs);
      }
      else if (move.effect?.status === 'smelling-salts-effect') {
          SmellingSalts.handleSmellingSaltsCure(defender, logs);
      }
      else if (move.effect?.status === 'burn-up-effect') {
          BurnUp.handleBurnUpEffect(attacker, logs);
      }
      else if (move.effect?.status === 'double-shock-effect') {
          DoubleShock.handleDoubleShockEffect(attacker, logs);
      }
      else if (move.effect?.status === 'salt-cure') {
          SaltCure.applySaltCure(attacker, defender, logs);
      }
      else if (move.effect?.status === 'syrup-bomb') {
          SyrupBomb.handleSyrupBombEffect(defender, logs);
      }
      else if (move.effect?.status === 'blue-flare-effect') {
          BlueFlare.handleBlueFlareEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'dizzy-punch-effect') {
          DizzyPunch.handleDizzyPunchEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'strange-steam-effect') {
          StrangeSteam.handleStrangeSteamEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'ice-burn-effect') {
          IceBurn.handleIceBurnEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'freeze-shock-effect') {
          IceBurn.handleFreezeShockEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'constrict') {
          Constrict.handleConstrictEffect(attacker, defender, logs, state);
      }
      else if (move.name === 'lick') {
          Lick.handleLickEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'stone-axe') {
          StoneAxe.handleStoneAxeEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'steam-eruption') {
          SteamEruption.handleSteamEruptionEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'plasma-fists') {
          if (state) PlasmaFists.handlePlasmaFistsEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status === 'spDefense-down-2') {
          // Seed Flare e outros moves com esse efeito
          SeedFlare.handleSeedFlareEffect(attacker, defender, logs, state);
      }
      else if (move.effect?.status.includes('-')) {
          StatChanges.handleSecondaryStatChanges(attacker, defender, move, logs, state);
      } else {
          VolatileStatus.handleVolatileStatus(attacker, defender, move, move.effect?.status || '', logs, state);
      }
  }

  Stench.handleStench(attacker, defender, move, logs, isGasActive, ignoresAbilities);
  return {};
}
