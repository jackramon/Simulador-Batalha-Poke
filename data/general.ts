
export const WEATHER_DATA: Record<string, {name: string; class: string; desc: string; icon: string}> = {
  'none': { name: 'Céu Limpo', class: 'bg-gray-100 border-gray-300 text-gray-600', desc: 'Sem efeitos climáticos ativos.', icon: '☀️' },
  'sun': { name: 'Sol Forte', class: 'bg-orange-100 border-orange-400 text-orange-800', desc: 'Aumenta ataques de Fogo (1.5x), reduz Água (0.5x).', icon: '🔥' },
  'rain': { name: 'Chuva', class: 'bg-blue-100 border-blue-400 text-blue-800', desc: 'Aumenta ataques de Água (1.5x), reduz Fogo (0.5x).', icon: '💧' },
  'sand': { name: 'Tempestade de Areia', class: 'bg-yellow-100 border-yellow-400 text-yellow-800', desc: 'Dano residual em não-Pedra/Terra/Aço. Aumenta Def. Esp. de Pedra (1.5x).', icon: '🌪️' },
  'hail': { name: 'Granizo', class: 'bg-cyan-100 border-cyan-400 text-cyan-800', desc: 'Dano residual em não-Gelo.', icon: '❄️' }
};

export const TERRAIN_DATA: Record<string, {name: string; class: string; desc: string; icon: string}> = {
  'none': { name: 'Campo Normal', class: 'bg-gray-100 border-gray-300 text-gray-600', desc: 'Sem efeitos de terreno ativos.', icon: '🏟️' },
  'electric': { name: 'Campo Elétrico', class: 'bg-yellow-100 border-yellow-400 text-yellow-800', desc: 'Aumenta golpes Elétricos (1.3x) e impede o sono em Pokémon aterrados.', icon: '⚡' },
  'grassy': { name: 'Campo Gramado', class: 'bg-green-100 border-green-400 text-green-800', desc: 'Aumenta golpes de Grama (1.3x), cura HP a cada turno e reduz dano de Terremoto.', icon: '🌿' },
  'misty': { name: 'Campo de Névoa', class: 'bg-pink-100 border-pink-400 text-pink-800', desc: 'Reduz dano de Dragão recebido (0.5x) e protege contra condições de status.', icon: '✨' },
  'psychic': { name: 'Campo Psíquico', class: 'bg-purple-100 border-purple-400 text-purple-800', desc: 'Aumenta golpes Psíquicos (1.3x) e protege Pokémon aterrados contra movimentos de prioridade.', icon: '👁️' }
};

export const TRANSLATION_REGEX = [
    { p: /User/gi, r: 'Usuário' },
    { p: /Opponent/gi, r: 'Oponente' },
    { p: /faints/gi, r: 'desmaia' },
    { p: /super effective/gi, r: 'super efetivo' }
];
