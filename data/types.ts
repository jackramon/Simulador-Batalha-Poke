
export const TYPE_NAMES_PT: Record<string, string> = {
  'normal': 'Normal', 'fire': 'Fogo', 'water': 'Água', 'electric': 'Elétrico', 
  'grass': 'Grama', 'ice': 'Gelo', 'fighting': 'Lutador', 'poison': 'Venenoso', 
  'ground': 'Terra', 'flying': 'Voador', 'psychic': 'Psíquico', 'bug': 'Inseto', 
  'rock': 'Pedra', 'ghost': 'Fantasma', 'dragon': 'Dragão', 'steel': 'Aço', 
  'fairy': 'Fada', 'dark': 'Noturno', 'unknown': 'Desconhecido', 'shadow': 'Sombrio',
  'stellar': 'Estelar'
};

export const TYPE_COLORS: Record<string, string> = {
  'normal': '#A8A878', 'fire': '#F08030', 'water': '#6890F0', 'electric': '#F8D030',
  'grass': '#78C850', 'ice': '#98D8D8', 'fighting': '#C03028', 'poison': '#A040A0',
  'ground': '#E0C068', 'flying': '#A890F0', 'psychic': '#F85888', 'bug': '#A8B820',
  'rock': '#B8A038', 'ghost': '#705898', 'dragon': '#7038F8', 'steel': '#B8B8D0',
  'fairy': '#EE99AC', 'dark': '#705848',
  'stellar': '#49c3fb'
};

export const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  'normal': { 'rock': 0.5, 'ghost': 0.0, 'steel': 0.5 },
  'fire': { 'fire': 0.5, 'water': 0.5, 'grass': 2.0, 'ice': 2.0, 'bug': 2.0, 'rock': 0.5, 'dragon': 0.5, 'steel': 2.0 },
  'water': { 'fire': 2.0, 'water': 0.5, 'grass': 0.5, 'ground': 2.0, 'rock': 2.0, 'dragon': 0.5 },
  'electric': { 'water': 2.0, 'electric': 0.5, 'grass': 0.5, 'ground': 0.0, 'flying': 2.0, 'dragon': 0.5 },
  'grass': { 'fire': 0.5, 'water': 2.0, 'grass': 0.5, 'poison': 0.5, 'ground': 2.0, 'flying': 0.5, 'bug': 0.5, 'rock': 2.0, 'dragon': 0.5, 'steel': 0.5 },
  'ice': { 'fire': 0.5, 'water': 0.5, 'grass': 2.0, 'ice': 0.5, 'ground': 2.0, 'flying': 2.0, 'dragon': 2.0, 'steel': 0.5 },
  'fighting': { 'normal': 2.0, 'ice': 2.0, 'poison': 0.5, 'flying': 0.5, 'psychic': 0.5, 'bug': 0.5, 'rock': 2.0, 'ghost': 0.0, 'dark': 2.0, 'steel': 2.0, 'fairy': 0.5 },
  'poison': { 'poison': 0.5, 'ground': 0.5, 'rock': 0.5, 'ghost': 0.5, 'steel': 0.0, 'fairy': 2.0 },
  'ground': { 'fire': 2.0, 'electric': 2.0, 'grass': 0.5, 'poison': 2.0, 'flying': 0.0, 'bug': 0.5, 'rock': 2.0, 'steel': 2.0 },
  'flying': { 'electric': 0.5, 'grass': 2.0, 'fighting': 2.0, 'bug': 2.0, 'rock': 0.5, 'steel': 0.5 },
  'psychic': { 'fighting': 2.0, 'poison': 2.0, 'steel': 0.5, 'dark': 0.0, 'psychic': 0.5 },
  'bug': { 'fire': 0.5, 'grass': 2.0, 'fighting': 0.5, 'poison': 0.5, 'flying': 0.5, 'psychic': 2.0, 'ghost': 0.5, 'steel': 0.5, 'fairy': 0.5, 'dark': 2.0 },
  'rock': { 'fire': 2.0, 'ice': 2.0, 'fighting': 0.5, 'ground': 0.5, 'flying': 2.0, 'bug': 2.0, 'steel': 0.5 },
  'ghost': { 'normal': 0.0, 'psychic': 2.0, 'ghost': 2.0, 'dark': 0.5 },
  'dragon': { 'steel': 0.5, 'fairy': 0.0, 'dragon': 2.0 },
  'steel': { 'fire': 0.5, 'water': 0.5, 'electric': 0.5, 'ice': 2.0, 'rock': 2.0, 'steel': 0.5, 'fairy': 2.0 },
  'dark': { 'fighting': 0.5, 'psychic': 2.0, 'ghost': 2.0, 'fairy': 0.5, 'dark': 0.5 },
  'fairy': { 'fire': 0.5, 'fighting': 2.0, 'poison': 0.5, 'steel': 0.5, 'dark': 2.0, 'dragon': 2.0 },
  'stellar': {} // Tratamento especial via lógica
};
