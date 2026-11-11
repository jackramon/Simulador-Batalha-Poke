
import { ItemData } from './types';

export const MEDICINE_ITEMS: Record<string, ItemData & { targetType?: 'pokemon' | 'move' }> = {
  'potion': { name: 'Poção', desc: 'Recupera 20 PV de um Pokémon.', category: 'medicine', effectValue: 20 },
  'super-potion': { name: 'Super Poção', desc: 'Recupera 60 PV de um Pokémon.', category: 'medicine', effectValue: 60 },
  'hyper-potion': { name: 'Hiper Poção', desc: 'Recupera 120 PV de um Pokémon.', category: 'medicine', effectValue: 120 },
  'max-potion': { name: 'Poção Máxima', desc: 'Recupera todo o PV de um Pokémon.', category: 'medicine' },
  'full-restore': { name: 'Restauração Completa', desc: 'Recupera todo o PV e cura status.', category: 'medicine' },
  'berry-juice': { name: 'Suco de Fruta', desc: 'Recupera 20 PV.', category: 'medicine', effectValue: 20 },
  'revive': { name: 'Reviver', desc: 'Revive um Pokémon desmaiado com metade do PV.', category: 'medicine' },
  'max-revive': { name: 'Reviver Máximo', desc: 'Revive um Pokémon desmaiado com PV total.', category: 'medicine' },
  'antidote': { name: 'Antídoto', desc: 'Cura veneno.', category: 'medicine' },
  'burn-heal': { name: 'Cura Queimadura', desc: 'Cura queimadura.', category: 'medicine' },
  'ice-heal': { name: 'Cura Gelo', desc: 'Cura congelamento.', category: 'medicine' },
  'awakening': { name: 'Despertar', desc: 'Acorda o Pokémon.', category: 'medicine' },
  'paralyze-heal': { name: 'Cura Paralisia', desc: 'Cura paralisia.', category: 'medicine' },
  'full-heal': { name: 'Cura Total', desc: 'Cura qualquer condição de status.', category: 'medicine' },
  // Outros (Mel é tecnicamente medicine no sistema atual)
  'honey': { name: 'Mel', desc: 'Um item doce que recupera um pouco de HP ao ser consumido.', category: 'medicine' },
  
  // Itens de PP
  'ether': { name: 'Éter', desc: 'Recupera 10 PP de um movimento selecionado.', category: 'medicine', targetType: 'move', effectValue: 10 },
  'max-ether': { name: 'Éter Máximo', desc: 'Recupera todos os PP de um movimento selecionado.', category: 'medicine', targetType: 'move' },
  'elixir': { name: 'Elixir', desc: 'Recupera 10 PP de todos os movimentos.', category: 'medicine', effectValue: 10 },
  'max-elixir': { name: 'Elixir Máximo', desc: 'Recupera todos os PP de todos os movimentos.', category: 'medicine' },
};

export const BATTLE_ITEMS: Record<string, ItemData> = {
  'x-attack': { name: 'X-Ataque', desc: 'Aumenta drasticamente o Ataque.', category: 'battle-item', effectValue: 2 },
  'x-defense': { name: 'X-Defesa', desc: 'Aumenta drasticamente a Defesa.', category: 'battle-item', effectValue: 2 },
  'x-sp-atk': { name: 'X-Atq. Esp.', desc: 'Aumenta drasticamente o Atq. Especial.', category: 'battle-item', effectValue: 2 },
  'x-sp-def': { name: 'X-Def. Esp.', desc: 'Aumenta drasticamente a Def. Especial.', category: 'battle-item', effectValue: 2 },
  'x-speed': { name: 'X-Velocidade', desc: 'Aumenta drasticamente a Velocidade.', category: 'battle-item', effectValue: 2 },
  'x-accuracy': { name: 'X-Precisão', desc: 'Aumenta drasticamente a Precisão.', category: 'battle-item', effectValue: 2 },
  'guard-spec': { name: 'Especial. Guarda', desc: 'Previne redução de atributos por 5 turnos.', category: 'battle-item' },
};
