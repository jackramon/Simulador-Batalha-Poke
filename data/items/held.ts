
import { ItemData } from './types';

export const HELD_ITEMS: Record<string, ItemData> = {
  'leftovers': { name: 'Restos', desc: 'Recupera um pouco de HP a cada turno.', category: 'held' },
  'life-orb': { name: 'Esfera da Vida', desc: 'Aumenta o dano mas causa recuo.', category: 'held' },
  'choice-band': { name: 'Faixa da Escolha', desc: 'Aumenta Ataque mas trava em um golpe.', category: 'held' },
  'choice-specs': { name: 'Óculos da Escolha', desc: 'Aumenta Atq. Esp. mas trava em um golpe.', category: 'held' },
  'choice-scarf': { name: 'Lenço da Escolha', desc: 'Aumenta Velocidade mas trava em um golpe.', category: 'held' },
  'assault-vest': { name: 'Colete de Assalto', desc: 'Aumenta Def. Esp. mas impede golpes de status.', category: 'held' },
  'rocky-helmet': { name: 'Capacete Dentado', desc: 'Causa dano ao atacante em contato.', category: 'held' },
  'expert-belt': { name: 'Faixa de Perito', desc: 'Aumenta dano de golpes super efetivos.', category: 'held' },
  'focus-sash': { name: 'Faixa de Foco', desc: 'Sobrevive a um golpe fatal com 1 HP se estiver cheio.', category: 'held' },
  'safety-goggles': { name: 'Óculos de Proteção', desc: 'Imune a danos climáticos e pós.', category: 'held' },
  'heavy-duty-boots': { name: 'Botas Pesadas', desc: 'Imune a perigos de entrada.', category: 'held' },
  'weakness-policy': { name: 'Seguro Fraqueza', desc: 'Aumenta Atk/SpA ao sofrer golpe super efetivo.', category: 'held' },
  'air-balloon': { name: 'Balão de Ar', desc: 'Flutua até ser atingido.', category: 'held' },
  'bright-powder': { name: 'Pó Brilhante', desc: 'Aumenta a Evasiva.', category: 'held' },
  'big-root': { name: 'Raiz Grande', desc: 'Aumenta a cura de golpes de drenagem.', category: 'held' },
  'light-clay': { name: 'Argila Luz', desc: 'Estende a duração de barreiras.', category: 'held' },
  'heat-rock': { name: 'Pedra Quente', desc: 'Estende a duração do Sol.', category: 'held' },
  'damp-rock': { name: 'Pedra Úmida', desc: 'Estende a duração da Chuva.', category: 'held' },
  'smooth-rock': { name: 'Pedra Lisa', desc: 'Estende a duração da Tempestade de Areia.', category: 'held' },
  'icy-rock': { name: 'Pedra Gélida', desc: 'Estende a duração do Granizo/Neve.', category: 'held' },
  'terrain-extender': { name: 'Extensor de Terreno', desc: 'Estende a duração do Terreno.', category: 'held' },
  'room-service': { name: 'Serviço de Quarto', desc: 'Reduz Velocidade em Trick Room.', category: 'held' },
  'red-card': { name: 'Cartão Vermelho', desc: 'Força oponente a trocar ao ser atingido.', category: 'held' },
  'eject-button': { name: 'Botão de Ejeção', desc: 'Troca ao ser atingido.', category: 'held' },
};
