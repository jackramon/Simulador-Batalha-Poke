
import { Pokemon, Move, BattleState } from '../../../../types';

export function getStormThrowPower(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  state: BattleState | undefined
): number {
  // Storm Throw sempre resulta em acerto crítico, a menos que o alvo tenha Battle Armor ou Shell Armor.
  // A lógica de crítico forçado é geralmente tratada no cálculo de dano principal (calculateDamage),
  // mas aqui podemos retornar o poder base inalterado.
  // O efeito crítico garantido deve ser sinalizado via flag ou tratado no motor de dano.
  
  // No entanto, para este projeto, a convenção para golpes com crítico garantido
  // (como Frost Breath e Storm Throw) é muitas vezes tratada definindo a propriedade `critRatio`
  // ou garantindo que o cálculo de dano detecte este movimento.
  
  // Como este handler é apenas para *modificação de poder*, e Storm Throw tem poder fixo de 60,
  // retornamos o poder base. A lógica de crítico será tratada no efeito secundário ou na flag de crítico.
  
  return move.power;
}
