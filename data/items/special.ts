
import { ItemData } from './types';

export const SPECIAL_ITEMS: Record<string, ItemData> = {};

// --- TRADUÇÕES DE PLACAS E MEMÓRIAS ---

const PLATE_TRANSLATIONS: Record<string, { name: string; type: string }> = {
  'flame-plate': { name: 'Placa de Chamas', type: 'Fogo' },
  'splash-plate': { name: 'Placa de Borrifo', type: 'Água' },
  'zap-plate': { name: 'Placa de Raios', type: 'Elétrico' },
  'meadow-plate': { name: 'Placa de Prado', type: 'Grama' },
  'icicle-plate': { name: 'Placa de Gelo', type: 'Gelo' },
  'fist-plate': { name: 'Placa de Punho', type: 'Lutador' },
  'toxic-plate': { name: 'Placa Tóxica', type: 'Venenoso' },
  'earth-plate': { name: 'Placa de Terra', type: 'Terra' },
  'sky-plate': { name: 'Placa de Céu', type: 'Voador' },
  'mind-plate': { name: 'Placa Mental', type: 'Psíquico' },
  'insect-plate': { name: 'Placa de Inseto', type: 'Inseto' },
  'stone-plate': { name: 'Placa de Pedra', type: 'Pedra' },
  'spooky-plate': { name: 'Placa Assustadora', type: 'Fantasma' },
  'draco-plate': { name: 'Placa Dracônica', type: 'Dragão' },
  'dread-plate': { name: 'Placa do Pavor', type: 'Noturno' },
  'iron-plate': { name: 'Placa de Ferro', type: 'Aço' },
  'pixie-plate': { name: 'Placa Pixie', type: 'Fada' }
};

Object.entries(PLATE_TRANSLATIONS).forEach(([id, info]) => {
    SPECIAL_ITEMS[id] = { 
        name: info.name, 
        desc: `Aumenta o poder de movimentos do tipo ${info.type}. Item para Arceus.`, 
        category: 'plate' 
    };
});

const MEMORY_TRANSLATIONS: Record<string, { name: string; type: string }> = {
  'fire-memory': { name: 'Memória de Fogo', type: 'Fogo' },
  'water-memory': { name: 'Memória de Água', type: 'Água' },
  'electric-memory': { name: 'Memória Elétrica', type: 'Elétrico' },
  'grass-memory': { name: 'Memória de Grama', type: 'Grama' },
  'ice-memory': { name: 'Memória de Gelo', type: 'Gelo' },
  'fighting-memory': { name: 'Memória de Luta', type: 'Lutador' },
  'poison-memory': { name: 'Memória Venenosa', type: 'Venenoso' },
  'ground-memory': { name: 'Memória de Terra', type: 'Terra' },
  'flying-memory': { name: 'Memória Voadora', type: 'Voador' },
  'psychic-memory': { name: 'Memória Psíquica', type: 'Psíquico' },
  'bug-memory': { name: 'Memória de Inseto', type: 'Inseto' },
  'rock-memory': { name: 'Memória de Pedra', type: 'Pedra' },
  'ghost-memory': { name: 'Memória Fantasma', type: 'Fantasma' },
  'dragon-memory': { name: 'Memória de Dragão', type: 'Dragão' },
  'dark-memory': { name: 'Memória Sombria', type: 'Noturno' },
  'steel-memory': { name: 'Memória Metálica', type: 'Aço' },
  'fairy-memory': { name: 'Memória de Fada', type: 'Fada' }
};

Object.entries(MEMORY_TRANSLATIONS).forEach(([id, info]) => {
    SPECIAL_ITEMS[id] = { 
        name: info.name, 
        desc: `Muda o tipo de Silvally para ${info.type}. Item para Silvally.`, 
        category: 'memory' 
    };
});
