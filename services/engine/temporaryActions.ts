/**
 * Definição única das ações temporárias, que não fazem parte do moveset do Pokémon:
 * a recarga de golpes como Hiper Raio (`recharge`) e o Debater usado quando não há PP
 * (`struggle`).
 *
 * O coordinator copia o objeto escolhido para `selectedMove` e esse campo entra no hash
 * dos checkpoints. Por isso a batalha ao vivo (IA local, LLM e botão da UI) e a
 * reconstrução do replay precisam usar exatamente os mesmos campos: qualquer campo extra
 * só de um dos lados muda o estado final e invalida um replay íntegro.
 */

export interface TemporaryActionData {
  name: 'recharge' | 'struggle';
  displayName: string;
  priority?: number;
  power?: number;
  type?: string;
}

/** Recarga: objeto mínimo, idêntico ao que a IA ao vivo entrega ao coordinator. */
export const createRechargeActionData = (): TemporaryActionData => ({
  name: 'recharge',
  displayName: 'Recarregar',
  priority: 0,
});

/** Debater: desfere dano de poder 50 do tipo Normal e aplica o recuo de 25% do HP máximo. */
export const createStruggleActionData = (): TemporaryActionData => ({
  name: 'struggle',
  displayName: 'Debater-se',
  power: 50,
  type: 'normal',
});

/** Reconstrói a ação temporária a partir do `moveId` gravado no replay. */
export const createTemporaryActionData = (moveId: string): TemporaryActionData | null => {
  if (moveId === 'recharge') return createRechargeActionData();
  if (moveId === 'struggle') return createStruggleActionData();
  return null;
};