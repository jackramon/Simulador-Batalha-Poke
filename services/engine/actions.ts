
import { Action, BattleState } from '../../types';
import { getEffectiveSpeed } from '../battleUtils';
import * as GaleWings from './handlers/abilities/gale_wings';
import * as Prankster from './handlers/abilities/prankster';
import * as MyceliumMight from './handlers/abilities/mycelium_might';
import * as AirLock from './handlers/abilities/air_lock';
import * as Stall from './handlers/abilities/stall';
import * as QuickDraw from './handlers/abilities/quick_draw';
import * as Pursuit from './handlers/moves/pursuit';
import * as GrassyGlide from './handlers/moves/grassyGlide';
import * as PriorityItems from './handlers/items/priority';

export function getSortedActions(actions: Action[], state: BattleState): Action[] {
  const isWeatherSuppressed = AirLock.isWeatherSuppressed(state);
  const effectiveWeather = isWeatherSuppressed ? 'none' : state.weather;

  const getEffectivePriority = (act: Action) => {
    // Ações de uso de Item e Troca possuem prioridade base +6 no sistema padrão
    if (act.type === 'item' || act.type === 'switch') {
        return 6; 
    }

    let p = act.priority || 0;
    
    // Aplica bônus/penalidades de habilidades que modificam prioridade dinamicamente para movimentos
    if (act.type === 'move') {
      p = MyceliumMight.getModifiedPriority(act.user, act.data, p);
      
      // Só aplica buffs se Mycelium Might não tiver forçado para -7
      if (p !== -7) {
        p += GaleWings.getPriorityBoost(act.user, act.data);
        p += Prankster.getPriorityBoost(act.user, act.data);
        
        // Prioridade do Deslize na Grama
        if (act.data.name === 'grassy-glide') {
            p += GrassyGlide.getPriorityBoost(act.user, state);
        }

        // Saque Rápido (Quick Draw) - Adiciona prioridade fracionária para desempatar na mesma bracket
        p += QuickDraw.getPriorityBoost(act.user, state);

        // Itens de Prioridade (Quick Claw, Custap Berry, Lagging Tail)
        // Adiciona modificador fracionário (ex: +0.1 ou -0.1)
        p += PriorityItems.getItemPriorityMod(act.user, state, state.logs);
      }

      // Perseguição (Pursuit) interceptando troca
      // Encontra a ação do oponente para verificar se é uma troca
      const opponentAction = actions.find(a => a.playerNum !== act.playerNum);
      if (Pursuit.shouldPursuitIntercept(act.data.name, opponentAction)) {
          // Trocas têm prioridade 6. Para interceptar, Perseguição precisa de 7.
          p = 7;
      }
    }
    return p;
  };

  // Pré-calcula prioridades e desempates para garantir estabilidade na ordenação
  // Isso evita que Math.random() seja chamado múltiplas vezes para o mesmo par no sort()
  const actionsWithPriority = actions.map(action => {
      if (action.calculatedPriority === undefined) {
          action.calculatedPriority = getEffectivePriority(action);
      }
      return {
          action,
          priority: action.calculatedPriority,
          tieBreaker: action.tieBreaker ?? Math.random() // Use pre-calculated tie-breaker from coordinator
      };
  });

  actionsWithPriority.sort((a, b) => {
    const prioA = a.priority;
    const prioB = b.priority;

    if (prioA !== prioB) {
      return prioB - prioA;
    }

    // Lógica para a habilidade Lento (Stall)
    // Se um Pokémon tem Stall e o outro não, o com Stall vai por último na prioridade atual.
    const stallA = Stall.isStallActive(a.action.user, state);
    const stallB = Stall.isStallActive(b.action.user, state);

    if (stallA !== stallB) {
        // Retornar 1 faz 'a' vir depois de 'b' no array ordenado
        return stallA ? 1 : -1;
    }
    
    // Determina se Tailwind está ativo para cada lado
    const isP1 = state.team1.some(p => p.id === a.action.user.id);
    const tailwindA = isP1 ? state.p1Hazards.tailwind > 0 : state.p2Hazards.tailwind > 0;
    
    const isP1B = state.team1.some(p => p.id === b.action.user.id);
    const tailwindB = isP1B ? state.p1Hazards.tailwind > 0 : state.p2Hazards.tailwind > 0;

    let speedA = getEffectiveSpeed(a.action.user, effectiveWeather, tailwindA);
    let speedB = getEffectiveSpeed(b.action.user, effectiveWeather, tailwindB);
    
    // Speed Tie RNG: Se as velocidades forem idênticas, usa o tieBreaker pré-calculado
    if (speedA === speedB) {
        return a.tieBreaker - b.tieBreaker;
    }

    if (state.trickRoomActive) {
      return speedA - speedB;
    }
    return speedB - speedA;
  });

  return actionsWithPriority.map(item => item.action);
}
