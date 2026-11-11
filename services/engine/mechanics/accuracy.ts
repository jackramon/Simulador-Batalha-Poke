
import { Pokemon, Move } from '../../../types';
import { 
    ALWAYS_HIT_MOVES, 
    HITS_FLYING_MOVES,
    HITS_DIGGING_MOVES,
    HITS_DIVING_MOVES
} from '../../../data/moves';
import { OHKO_MOVES } from '../../../data/moves/categories';
import * as MoldBreaker from '../handlers/abilities/mold_breaker';
import * as MyceliumMight from '../handlers/abilities/mycelium_might';
import * as Unaware from '../handlers/abilities/unaware';
import * as ChipAway from '../handlers/moves/chipAway';

export function calculateHitChance(move: Move, attacker: Pokemon, defender: Pokemon, weather: string, gravity: boolean = false): number | '∞' {
  // ==================================================================
  // FASE 1: CHECAGENS DE "SEMPRE ACERTA" (∞) E IMUNIDADES ABSOLUTAS
  // ==================================================================
  
  if (ALWAYS_HIT_MOVES.includes(move.name)) return '∞';
  if (attacker.ability === 'no-guard' || defender.ability === 'no-guard') return '∞';
  
  // Lock-On / Mind Reader
  if (defender.statusEffects['lock-on'] && defender.statusEffects['lock-on'].sourceMoveName === attacker.id.toString()) {
      return '∞';
  }
  
  // Telekinesis (Exceto OHKO)
  if (defender.statusEffects['telekinesis'] && !OHKO_MOVES.includes(move.name)) {
      return '∞';
  }

  // Clima: Chuva (Thunder, Hurricane, etc)
  const RAIN_ACCURATE_MOVES = [
      'thunder', 'hurricane', 'wildbolt-storm', 
      'bleakwind-storm'
  ];
  if (weather === 'rain' && RAIN_ACCURATE_MOVES.includes(move.name)) {
      return '∞';
  }

  // Clima: Granizo/Neve (Blizzard)
  if (weather === 'hail' && move.name === 'blizzard') return '∞';

  // Toxic usado por tipo Venenoso
  if (move.name === 'toxic' && attacker.types.includes('poison')) return '∞';

  // Glaive Rush Vulnerability
  if (defender.statusEffects['glaive-rush']) return '∞';

  // Minimize Bypass
  const minimizeBypassMoves = [
      'stomp', 'steamroller', 'body-slam', 'dragon-rush',
      'heat-crash', 'heavy-slam', 'flying-press', 'malicious-moonsault'
  ];
  if (defender.statusEffects['minimize'] && minimizeBypassMoves.includes(move.name)) {
      return '∞';
  }

  // Verificações de estados semi-invulneráveis (Fly, Dig, etc.)
  // Se o alvo estiver invulnerável e o golpe não for capaz de atingi-lo, retorna 0 (Erro).
  if (defender.statusEffects['flying'] || defender.statusEffects['bouncing']) {
      if (!HITS_FLYING_MOVES.includes(move.name)) return 0;
  }
  if (defender.statusEffects['digging']) {
      if (!HITS_DIGGING_MOVES.includes(move.name)) return 0;
  }
  if (defender.statusEffects['diving']) {
      if (!HITS_DIVING_MOVES.includes(move.name)) return 0;
  }
  if (defender.statusEffects['shadow-force']) {
      return 0; 
  }

  // ==================================================================
  // FASE 2: DEFINIÇÃO DA PRECISÃO BASE
  // ==================================================================

  if (move.accuracy === null || move.accuracy === undefined) return '∞';
  
  let accuracy: number = move.accuracy;

  // Ajuste de base para Thunder/Hurricane no Sol (50%)
  if (weather === 'sun' && RAIN_ACCURATE_MOVES.includes(move.name)) {
      accuracy = 50;
  }

  // ==================================================================
  // FASE 3: MULTIPLICADORES DO USUÁRIO (FLAT MODIFIERS)
  // ==================================================================

  let attackerModifier = 1.0;

  if (attacker.ability === 'compound-eyes') attackerModifier *= 1.3;
  if (attacker.ability === 'victory-star') attackerModifier *= 1.1;
  if (attacker.ability === 'hustle' && move.damageClass === 'physical') attackerModifier *= 0.8;

  if (attacker.heldItem === 'wide-lens') attackerModifier *= 1.1;
  if (attacker.heldItem === 'zoom-lens' && defender.movedThisTurn) attackerModifier *= 1.2;

  accuracy *= attackerModifier;

  // ==================================================================
  // FASE 4: MULTIPLICADORES DO ALVO (FLAT MODIFIERS)
  // ==================================================================
  
  // Mycelium Might ignora habilidades defensivas em golpes de status
  const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability) || MyceliumMight.shouldIgnoreAbilities(attacker, move);
  const isGasActive = false; // Simplificação (sem acesso ao estado global aqui)

  let defenderModifier = 1.0;

  if (!ignoresAbilities) {
      if (defender.ability === 'sand-veil' && weather === 'sand') defenderModifier *= 0.8;
      if (defender.ability === 'snow-cloak' && weather === 'hail') defenderModifier *= 0.8;
      if (defender.ability === 'tangled-feet' && defender.statusEffects.confusion) defenderModifier *= 0.5;
  }

  if (defender.heldItem === 'bright-powder' || defender.heldItem === 'lax-incense') {
      defenderModifier *= 0.9;
  }

  accuracy *= defenderModifier;

  // Wonder Skin (Aplica-se após outros modificadores do defensor)
  if (!ignoresAbilities && defender.ability === 'wonder-skin' && move.damageClass === 'status' && accuracy > 50) {
      accuracy = 50;
  }

  // ==================================================================
  // FASE 5: CÁLCULO DE ESTÁGIOS (STAGE MODIFIERS)
  // ==================================================================

  let accStage = attacker.statStages.accuracy;
  let evaStage = defender.statStages.evasion;

  // Unaware Logic
  if (Unaware.shouldIgnoreOpponentDefenseStages(attacker, isGasActive)) {
      evaStage = 0; // Atacante Unaware ignora Evasiva do alvo
  }
  if (Unaware.shouldIgnoreOpponentAttackStages(defender, attacker.ability, isGasActive)) {
      accStage = 0; // Defensor Unaware ignora Precisão do atacante (modificações)
  }

  // Habilidades/Moves que ignoram evasiva positiva
  const attackerIgnoresEvasion = attacker.ability === 'keen-eye' || 
                                 attacker.ability === 'minds-eye' || 
                                 attacker.ability === 'illuminate' ||
                                 ignoresAbilities ||
                                 ChipAway.shouldIgnoreDefensiveStats(move);

  if (attackerIgnoresEvasion && evaStage > 0) {
      evaStage = 0;
  }

  // Fórmula de Estágio: 3 / (3 + stage) para negativo, (3 + stage) / 3 para positivo
  // stage = Accuracy - Evasion
  let stage = accStage - evaStage;
  stage = Math.max(-6, Math.min(6, stage));

  let stageMultiplier = 1.0;
  if (stage >= 0) {
      stageMultiplier = (3 + stage) / 3;
  } else {
      stageMultiplier = 3 / (3 + Math.abs(stage));
  }

  accuracy *= stageMultiplier;

  // ==================================================================
  // FASE 6: MODIFICADORES GLOBAIS
  // ==================================================================

  if (gravity) {
      accuracy *= (5/3);
  }

  // ==================================================================
  // FASE 7: ARREDONDAMENTO
  // ==================================================================

  return Math.floor(accuracy);
}
