
import { TYPE_EFFECTIVENESS } from '../../../data/types';
import { WIND_MOVES } from '../../../data/moves';
import * as MoldBreaker from '../handlers/abilities/mold_breaker';
import * as Bulletproof from '../handlers/abilities/bulletproof';
import * as Soundproof from '../handlers/abilities/soundproof';
import * as Scrappy from '../handlers/abilities/scrappy';
import * as MindsEye from '../handlers/abilities/minds_eye';
import * as FreezeDry from '../handlers/moves/freezeDry';
import * as FlyingPress from '../handlers/moves/flyingPress';

export function calculateTypeEffectiveness(
    moveType: string, 
    defenderTypes: string[], 
    defenderAbility: string, 
    attackerAbility?: string, 
    moveName?: string,
    defenderStatus?: Record<string, any>
) {
  // Guardas Defensivas (Prevenção de Crash em Simulação/Minimax)
  if (!moveType || !defenderTypes || !Array.isArray(defenderTypes)) {
      return { multiplier: 1.0, message: '', color: 'text-gray-600', immunityType: null };
  }

  let multiplier = 1.0;
  let message = '';
  let immunityType = null;
  const moveTypeLower = moveType.toLowerCase();

  // Lógica Especial para Tipo Estelar (Stellar)
  // Super Efetivo (2x) contra alvos Terastalizados. Neutro (1x) contra o resto.
  if (moveTypeLower === 'stellar') {
      if (defenderStatus && defenderStatus.isTerastallized) {
          return { multiplier: 2.0, message: 'É super efetivo!', color: 'text-red-600 font-bold', immunityType: null };
      }
      // Se não for Terastalizado, é neutro (1x)
      return { multiplier: 1.0, message: '', color: 'text-gray-600', immunityType: null };
  }

  if (moveName === 'struggle') {
      return { multiplier: 1.0, message: '', color: 'text-gray-600', immunityType: null };
  }

  const ignoresAbilities = MoldBreaker.suppressesAbilities(attackerAbility);
  const attackerIgnoresRedirection = attackerAbility === 'propeller-tail' || attackerAbility === 'stalwart';

  // Verifica imunidade por Levitação Magnética (Magnet Rise)
  if (defenderStatus && defenderStatus['magnet-rise'] && moveTypeLower === 'ground') {
      return { multiplier: 0, message: 'Imune (Levitação Magnética)', color: 'text-yellow-600 italic', immunityType: 'magnet-rise' };
  }

  if (!ignoresAbilities) {
      // EXCEÇÃO: Ataque de Areia ignora Levitação
      if (defenderAbility === 'levitate' && moveTypeLower === 'ground' && moveName !== 'sand-attack') {
          return { multiplier: 0, message: 'Imune (Levitação)', color: 'text-gray-500 italic', immunityType: 'levitate' };
      }
      
      if (defenderAbility === 'volt-absorb' && moveTypeLower === 'electric') return { multiplier: 0, message: 'Absorvido!', color: 'text-green-500', immunityType: 'volt-absorb' };
      
      if (defenderAbility === 'bulletproof' && moveName && Bulletproof.isBallBombMove(moveName)) {
          return { multiplier: 0, message: 'Imune (À Prova de Balas)', color: 'text-gray-500 italic', immunityType: 'bulletproof' };
      }

      if (defenderAbility === 'soundproof' && moveName && Soundproof.isSoundMove(moveName)) {
          return { multiplier: 0, message: 'Imune (À Prova de Som)', color: 'text-gray-500 italic', immunityType: 'soundproof' };
      }

      if (defenderAbility === 'wind-rider' && moveName && WIND_MOVES.includes(moveName)) {
          return { multiplier: 0, message: 'Imune (Cavaleiro do Vento)', color: 'text-indigo-500 italic', immunityType: 'wind-rider' };
      }

      if (defenderAbility === 'lightning-rod' && moveTypeLower === 'electric') {
          if (!attackerIgnoresRedirection) {
              return { multiplier: 0, message: 'Imune (Para-Raio)', color: 'text-gray-500 italic', immunityType: 'lightning-rod' };
          }
      }
      
      if (defenderAbility === 'storm-drain' && moveTypeLower === 'water') {
           if (!attackerIgnoresRedirection) {
              return { multiplier: 0, message: 'Imune (Dreno Marítimo)!', color: 'text-blue-500', immunityType: 'storm-drain' };
          }
      }

      if (defenderAbility === 'water-absorb' && moveTypeLower === 'water') return { multiplier: 0, message: 'Absorvido!', color: 'text-green-500', immunityType: 'water-absorb' };
      if (defenderAbility === 'flash-fire' && moveTypeLower === 'fire') return { multiplier: 0, message: 'Fogo Absorvido!', color: 'text-orange-500', immunityType: 'flash-fire' };
      if (defenderAbility === 'earth-eater' && moveTypeLower === 'ground') return { multiplier: 0, message: 'Absorvido!', color: 'text-green-500', immunityType: 'earth-eater' };
      if (defenderAbility === 'well-baked-body' && moveTypeLower === 'fire') return { multiplier: 0, message: 'Imune (Corpo Bem Assado)', color: 'text-gray-500 italic', immunityType: 'well-baked-body' };
      if (defenderAbility === 'sap-sipper' && moveTypeLower === 'grass') return { multiplier: 0, message: 'Absorvido (Herbívoro)!', color: 'text-green-500', immunityType: 'sap-sipper' };
      if (defenderAbility === 'motor-drive' && moveTypeLower === 'electric') return { multiplier: 0, message: 'Imune (Motor Propulsor)!', color: 'text-blue-500', immunityType: 'motor-drive' };
      if (defenderAbility === 'dry-skin' && moveTypeLower === 'water') return { multiplier: 0, message: 'Absorvido (Pele Seca)!', color: 'text-green-500', immunityType: 'dry-skin' };
  }

  // Verifica se o alvo está sob efeito de Profecia (Foresight)
  const isForesightActive = defenderStatus && defenderStatus['foresight'];

  // Verifica se o alvo está sob efeito de Trick-or-Treat (Gostosuras ou Travessuras)
  const isTrickOrTreatActive = defenderStatus && defenderStatus['trick-or-treat'];

  for (const defenderType of defenderTypes) {
    if (!defenderType) continue; // Loop guard para tipos indefinidos

    let eff = TYPE_EFFECTIVENESS[moveTypeLower]?.[defenderType.toLowerCase()];
    
    // Scrappy (Destemido), Mind's Eye (Olho da Mente) ou Foresight (Profecia) override: Normal e Lutador acertam Fantasmas
    if (eff === 0.0 && defenderType.toLowerCase() === 'ghost') {
        const hasScrappy = Scrappy.canHitGhost(attackerAbility, moveTypeLower) || MindsEye.canHitGhost(attackerAbility, moveTypeLower);
        const hasForesight = isForesightActive && (moveTypeLower === 'normal' || moveTypeLower === 'fighting');
        
        if (hasScrappy || hasForesight) {
            eff = 1.0;
        }
    }

    // Freeze-Dry (Liofilização) override: Gelo acerta Água com eficácia 2.0x
    if (moveName) {
        eff = FreezeDry.getModifiedEffectiveness(moveName, defenderType, eff);
    }
    
    // Flying Press (Prensa Voadora) override: Efetividade Dual (Lutador + Voador)
    if (moveName === 'flying-press') {
        eff = FlyingPress.getDualTypeEffectiveness(defenderType);
    }
    
    // EXCEÇÃO: Ataque de Areia atinge tipo Voador
    if (moveName === 'sand-attack' && moveTypeLower === 'ground' && defenderType.toLowerCase() === 'flying') {
        eff = 1.0;
    }
    
    if (eff !== undefined) multiplier *= eff;
  }

  // Aplica o modificador do tipo Fantasma se Trick-or-Treat estiver ativo
  if (isTrickOrTreatActive) {
      const ghostEff = TYPE_EFFECTIVENESS[moveTypeLower]?.['ghost'];
      if (ghostEff !== undefined) {
          // Scrappy/MindsEye/Foresight override para o tipo Fantasma adicionado
          if (ghostEff === 0.0 && (moveTypeLower === 'normal' || moveTypeLower === 'fighting')) {
              const hasScrappy = Scrappy.canHitGhost(attackerAbility, moveTypeLower) || MindsEye.canHitGhost(attackerAbility, moveTypeLower);
              const hasForesight = isForesightActive;
              if (hasScrappy || hasForesight) {
                  multiplier *= 1.0;
              } else {
                  multiplier *= 0.0;
              }
          } else {
              multiplier *= ghostEff;
          }
      }
  }

  if (multiplier >= 2.0) message = 'É super efetivo!';
  else if (multiplier < 1.0 && multiplier > 0.0) message = 'Não é muito efetivo...';
  else if (multiplier === 0.0) message = 'Não tem efeito.';

  let color = 'text-gray-600';
  if (multiplier >= 2.0) color = 'text-red-600 font-bold';
  else if (multiplier > 0 && multiplier < 1.0) color = 'text-blue-600';
  else if (multiplier === 0.0) color = 'text-gray-400 italic';

  return { multiplier, message, color, immunityType };
}
