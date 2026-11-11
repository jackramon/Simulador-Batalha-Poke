
import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import { ABILITY_EFFECTS } from '../../../../data/abilities';
import { log } from '../../utils';
import * as DragonMaw from './dragon_maw';
import * as Steelworker from './steelworker';
import * as Overgrow from './overgrow';
import * as Torrent from './torrent';
import * as Transistor from './transistor';
import * as FlashFire from './flash_fire';
import * as SandForce from './sand_force';
import * as Filter from './filter';
import * as Electromorphosis from './electromorphosis';
import * as NeutralizingGas from './neutralizing_gas';
import * as Sharpness from './sharpness';
import * as Analytic from './analytic';
import * as Heatproof from './heatproof';
import * as FairyAura from './fairy_aura';
import * as DarkAura from './dark_aura';
import * as Terrain from '../terrain';
import * as IceScales from './ice_scales';
import * as FurCoat from './fur_coat';
import * as Fluffy from './fluffy';
import * as ToughClaws from './tough_claws';
import * as Reckless from './reckless';
import * as Infiltrator from './infiltrator';
import * as TintedLens from './tinted_lens';
import * as StrongJaw from './strong_jaw';
import * as HadronEngine from './hadron_engine';
import * as PunkRock from './punk_rock';
import * as IronFist from './iron_fist';
import * as Refrigerate from './refrigerate';
import * as Rivalry from './rivalry';
import * as SupremeOverlord from './supreme_overlord';
import * as MoldBreaker from './mold_breaker';
import * as GrassPelt from './grass_pelt';
import * as Multiscale from './multiscale';
import * as Pixilate from './pixilate';
import * as Galvanize from './galvanize';
import * as Battery from './battery';
import * as SteelySpirit from './steely_spirit';
import * as FriendGuard from './friend_guard';
import * as PlusMinus from './plus_minus';
import * as MegaLauncher from './mega_launcher';
import * as PowerSpot from './power_spot';
import * as PurifyingSalt from './purifying_salt';
import * as Normalize from './normalize';
import * as ToxicBoost from './toxic_boost';
import * as SheerForce from './sheer_force';
import * as RockyPayload from './rocky_payload';
import * as FlareBoost from './flare_boost';
import * as TeraShell from './tera_shell';

export function getAbilityDamageMultiplier(
  attacker: Pokemon, 
  defender: Pokemon,
  move: Move, 
  hitIndex: number,
  logs: LogEntry[],
  weather: string = 'none',
  isGasActive: boolean = false,
  state?: BattleState,
  typeEffectiveness: number = 1.0
): number {
  if (attacker.statusEffects['gastro-acid']) {
      return 1.0;
  }

  if (NeutralizingGas.isAbilitySuppressed(attacker.ability, isGasActive)) {
      return 1.0;
  }

  let multiplier = 1;

  const supremeMult = SupremeOverlord.getPowerMultiplier(attacker, state);
  if (supremeMult > 1) {
      multiplier *= supremeMult;
      if (hitIndex === 0) log(logs, `O poder de ${attacker.name} aumentou com o Soberano Supremo!`, 'text-indigo-600 text-xs italic');
  }

  const batteryMult = Battery.getBatteryMultiplier(attacker, move, state);
  if (batteryMult > 1) {
      multiplier *= batteryMult;
      if (hitIndex === 0) log(logs, `${attacker.name} teve o poder aumentado pela Bateria do aliado!`, 'text-yellow-600 text-xs italic');
  }

  const powerSpotMult = PowerSpot.getPowerSpotMultiplier(attacker, move, state);
  if (powerSpotMult > 1) {
      multiplier *= powerSpotMult;
      if (hitIndex === 0) log(logs, `${attacker.name} recebeu energia do Ponto de Energia do aliado!`, 'text-indigo-500 text-xs italic');
  }

  const plusMinusMult = PlusMinus.getMultiplier(attacker, isGasActive, state);
  if (plusMinusMult > 1 && move.damageClass === 'special') {
      multiplier *= plusMinusMult;
      if (hitIndex === 0) log(logs, `O Ataque Especial de ${attacker.name} aumentou devido à sua polaridade!`, 'text-yellow-500 text-xs italic');
  }

  const megaLauncherMult = MegaLauncher.getPowerMultiplier(attacker, move);
  if (megaLauncherMult > 1) {
      multiplier *= megaLauncherMult;
      if (hitIndex === 0) log(logs, `O Mega Lançador de ${attacker.name} aumentou o poder do pulso!`, 'text-blue-500 text-xs italic');
  }

  const steelyMult = SteelySpirit.getSteelySpiritMultiplier(attacker, move, state);
  if (steelyMult > 1) {
      multiplier *= steelyMult;
      if (hitIndex === 0) log(logs, `O poder de ${move.displayName} aumentou com o Espírito Férreo!`, 'text-gray-600 text-xs italic font-bold');
  }

  const rivalryMult = Rivalry.getPowerMultiplier(attacker, defender, move);
  if (rivalryMult !== 1.0) {
      multiplier *= rivalryMult;
      if (hitIndex === 0) {
          const msg = rivalryMult > 1 
            ? `${attacker.name} está motivado pela rivalidade!` 
            : `${attacker.name} perdeu o foco devido à rivalidade...`;
          log(logs, msg, 'text-red-500 text-xs italic');
      }
  }

  const refrigerateMult = Refrigerate.getPowerMultiplier(attacker, move);
  if (refrigerateMult > 1) {
      multiplier *= refrigerateMult;
      if (hitIndex === 0) log(logs, `O Refrigerar de ${attacker.name} aumentou o poder do ataque congelado!`, 'text-blue-400 text-xs italic');
  }

  const pixilateMult = Pixilate.getPowerMultiplier(attacker, move);
  if (pixilateMult > 1) {
      multiplier *= pixilateMult;
      if (hitIndex === 0) log(logs, `A Pele de Fada de ${attacker.name} aumentou o poder do ataque encantado!`, 'text-pink-400 text-xs italic');
  }

  const galvanizeMult = Galvanize.getPowerMultiplier(attacker, move);
  if (galvanizeMult > 1) {
      multiplier *= galvanizeMult;
      if (hitIndex === 0) log(logs, `O Galvanizar de ${attacker.name} aumentou o poder do ataque elétrico!`, 'text-yellow-400 text-xs italic');
  }

  const normalizeMult = Normalize.getPowerMultiplier(attacker, move);
  if (normalizeMult > 1) {
      multiplier *= normalizeMult;
      if (hitIndex === 0) log(logs, `O poder foi aumentado pela habilidade Normalizar de ${attacker.name}!`, 'text-gray-500 text-xs italic');
  }

  const toxicBoostMult = ToxicBoost.getPowerMultiplier(attacker, move);
  if (toxicBoostMult > 1) {
      multiplier *= toxicBoostMult;
      if (hitIndex === 0) log(logs, `O Impulso Tóxico de ${attacker.name} aumentou seu Ataque!`, 'text-purple-600 font-bold italic');
  }

  const flareBoostMult = FlareBoost.getPowerMultiplier(attacker, move);
  if (flareBoostMult > 1) {
      multiplier *= flareBoostMult;
      if (hitIndex === 0) log(logs, `O Impulso de Chamas de ${attacker.name} aumentou seu Atq. Especial!`, 'text-red-500 font-bold italic');
  }

  if (state && state.terrain !== 'none') {
      const terrainMult = Terrain.getTerrainDamageMultiplier(attacker, defender, move, state.terrain);
      if (terrainMult !== 1.0) {
          multiplier *= terrainMult;
          if (hitIndex === 0) {
              const effectType = terrainMult > 1 ? "aumentou" : "reduziu";
              log(logs, `O poder de ${move.displayName} ${effectType} devido ao campo ativo!`, 'text-indigo-600 italic text-[10px]');
          }
      }
  }

  const hadronMult = HadronEngine.getSpAttackMultiplier(attacker, state?.terrain || 'none');
  if (hadronMult > 1 && move.damageClass === 'special') {
      multiplier *= hadronMult;
      if (hitIndex === 0) log(logs, `O Motor de Hádrons de ${attacker.name} aumentou seu Ataque Especial!`, 'text-yellow-600 text-xs italic');
  }

  const punkRockOffense = PunkRock.getPowerMultiplier(attacker, move);
  if (punkRockOffense > 1) {
      multiplier *= punkRockOffense;
      if (hitIndex === 0) log(logs, `O Punk Rock de ${attacker.name} aumentou o poder do som!`, 'text-purple-600 text-xs italic');
  }

  const ironFistMult = IronFist.getPowerMultiplier(attacker, move);
  if (ironFistMult > 1) {
      multiplier *= ironFistMult;
      if (hitIndex === 0) log(logs, `Os Punhos de Ferro de ${attacker.name} aumentaram o poder do soco!`, 'text-orange-700 text-xs italic');
  }

  const tintedMult = TintedLens.getDamageMultiplier(attacker, typeEffectiveness, isGasActive);
  if (tintedMult > 1) {
      multiplier *= tintedMult;
      if (hitIndex === 0) log(logs, `O poder do ataque dobrou devido às Lentes Coloridas!`, 'text-purple-600 text-xs italic');
  }

  const fairyAuraMult = FairyAura.getFairyAuraMultiplier(move, state);
  if (fairyAuraMult !== 1.0) {
      multiplier *= fairyAuraMult;
  }

  const darkAuraMult = DarkAura.getDarkAuraMultiplier(move, state);
  if (darkAuraMult !== 1.0) {
      multiplier *= darkAuraMult;
  }

  const strongJawMult = StrongJaw.getPowerMultiplier(attacker, move);
  if (strongJawMult > 1) multiplier *= strongJawMult;

  const overgrowMult = Overgrow.getPowerMultiplier(attacker, move);
  if (overgrowMult > 1) multiplier *= overgrowMult;

  const torrentMult = Torrent.getPowerMultiplier(attacker, move);
  if (torrentMult > 1) multiplier *= torrentMult;

  const flashFireMult = FlashFire.getPowerMultiplier(attacker, move);
  if (flashFireMult > 1) multiplier *= flashFireMult;

  const sandForceMult = SandForce.getPowerMultiplier(attacker, move, weather);
  if (sandForceMult > 1) multiplier *= sandForceMult;

  const sharpnessMult = Sharpness.getPowerMultiplier(attacker, move);
  if (sharpnessMult > 1) multiplier *= sharpnessMult;

  const toughClawsMult = ToughClaws.getPowerMultiplier(attacker, move);
  if (toughClawsMult > 1) multiplier *= toughClawsMult;

  const recklessMult = Reckless.getPowerMultiplier(attacker, move);
  if (recklessMult > 1) multiplier *= recklessMult;

  const analyticMult = Analytic.getPowerMultiplier(attacker, defender, move, state);
  if (analyticMult > 1) multiplier *= analyticMult;

  if (attacker.hp <= attacker.maxHP / 3) {
    if (attacker.ability === 'swarm' && move.type === 'bug') multiplier *= 1.5;
    else if (attacker.ability === 'blaze' && move.type === 'fire') multiplier *= 1.5;
  }

  multiplier *= Steelworker.getPowerMultiplier(attacker, move);
  multiplier *= DragonMaw.getPowerMultiplier(attacker, move);
  multiplier *= RockyPayload.getPowerMultiplier(attacker, move);
  
  const transistorMult = Transistor.getPowerMultiplier(attacker, move);
  if (transistorMult > 1) multiplier *= transistorMult;

  const chargedMult = Electromorphosis.getChargedMultiplier(attacker, move.type);
  if (chargedMult > 1) multiplier *= chargedMult;

  if (attacker.ability === 'rocky-payload' && move.type === 'rock') multiplier *= 1.5;
  if (attacker.ability === 'rocky-payload' && hitIndex === 0 && move.type === 'rock') log(logs, `A Carga Rochosa de ${attacker.name} aumentou o poder do golpe!`, 'text-gray-700 font-bold italic text-xs');

  if (attacker.ability === 'water-bubble' && move.type === 'water') multiplier *= 2;
  if (attacker.ability === 'stakeout' && defender.turnsActive === 0) multiplier *= 2;
  
  // Implementação modular de Sheer Force
  multiplier *= SheerForce.getPowerMultiplier(attacker, move);

  if (attacker.ability === 'technician' && move.power <= 60) multiplier *= 1.5;

  return multiplier;
}

export function getDefensiveMultipliers(
  defender: Pokemon,
  move: Move,
  hitIndex: number,
  logs: LogEntry[],
  attackerAbility: string | undefined,
  typeEffectiveness: number,
  isGasActive: boolean,
  attacker: Pokemon,
  state?: BattleState
): number {
  if (defender.statusEffects['gastro-acid']) {
      return 1.0;
  }

  if (NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive)) {
      return 1.0;
  }

  const ignoresAbilities = MoldBreaker.suppressesAbilities(attackerAbility);
  let multiplier = 1.0;

  if (defender.ability === 'prism-armor') {
      multiplier *= Filter.getDamageMultiplier(defender, typeEffectiveness);
  } else if (!ignoresAbilities) {
      multiplier *= Filter.getDamageMultiplier(defender, typeEffectiveness);
  }

  multiplier *= Heatproof.getFireMoveMultiplier(defender, move, ignoresAbilities);
  multiplier *= IceScales.getDamageMultiplier(defender, move, ignoresAbilities);
  multiplier *= FurCoat.getDamageMultiplier(defender, move, ignoresAbilities);
  multiplier *= PunkRock.getDefensiveMultiplier(defender, move, ignoresAbilities);
  multiplier *= Fluffy.getDamageMultiplier(defender, move, ignoresAbilities);

  // Multiescamas (Multiscale)
  multiplier *= Multiscale.getDamageMultiplier(defender, ignoresAbilities);

  // Pele de Grama (Grass Pelt)
  multiplier *= GrassPelt.getDamageMultiplier(defender.ability, state?.terrain || 'none', move);

  // Guarda Amiga (Friend Guard)
  if (!ignoresAbilities) {
      multiplier *= FriendGuard.getFriendGuardMultiplier(defender, state);
  }

  // Sal Purificador (Purifying Salt)
  multiplier *= PurifyingSalt.getDamageMultiplier(defender, move, ignoresAbilities, isGasActive);

  // Carapaça Tera (Tera Shell)
  if (!ignoresAbilities && defender.ability === 'tera-shell') {
      multiplier *= TeraShell.getDamageMultiplier(defender, typeEffectiveness, logs);
  }

  if (!ignoresAbilities && defender.ability === 'thick-fat' && (move.type === 'fire' || move.type === 'ice')) {
    multiplier *= 0.5;
    if (hitIndex === 0) log(logs, `O Sebo de ${defender.name} reduziu o dano do ataque!`, 'text-blue-600 italic');
  }

  return multiplier;
}
