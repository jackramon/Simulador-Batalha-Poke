
import { ItemData } from './types';

// Mapeamento de Pedra para Sufixo da API
export const MEGA_STONES: Record<string, string> = {
  'venusaurite': '-mega',
  'charizardite-x': '-mega-x',
  'charizardite-y': '-mega-y',
  'blastoisinite': '-mega',
  'beedrillite': '-mega',
  'pidgeotite': '-mega',
  'alakazite': '-mega',
  'slowbronite': '-mega',
  'gengarite': '-mega',
  'kangaskhanite': '-mega',
  'pinsirite': '-mega',
  'gyaradosite': '-mega',
  'aerodactylite': '-mega',
  'mewtwonite-x': '-mega-x',
  'mewtwonite-y': '-mega-y',
  'ampharosite': '-mega',
  'steelixite': '-mega',
  'scizorite': '-mega',
  'heracronite': '-mega',
  'houndoominite': '-mega',
  'tyranitarite': '-mega',
  'sceptilite': '-mega',
  'blazikenite': '-mega',
  'swampertite': '-mega',
  'gardevoirite': '-mega',
  'sableyeite': '-mega',
  'mawileite': '-mega',
  'aggronite': '-mega',
  'medichamite': '-mega',
  'manectite': '-mega',
  'sharpedonite': '-mega',
  'cameruptite': '-mega',
  'altarianite': '-mega',
  'banettite': '-mega',
  'absolite': '-mega',
  'glalitite': '-mega',
  'salamencite': '-mega',
  'metagrossite': '-mega',
  'latiasite': '-mega',
  'latiosite': '-mega',
  'lopunnite': '-mega',
  'garchompite': '-mega',
  'lucarionite': '-mega',
  'abomasite': '-mega',
  'galladite': '-mega',
  'audinite': '-mega',
  'diancite': '-mega'
};

// Definição de ItemData para exibição na UI
export const MEGA_STONE_ITEMS: Record<string, ItemData> = {};

Object.keys(MEGA_STONES).forEach(id => {
    // Formata o nome (ex: charizardite-x -> Charizardite X)
    const name = id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    MEGA_STONE_ITEMS[id] = {
        name,
        desc: "Permite a Mega Evolução durante a batalha.",
        category: 'held'
    };
});

// Mapping for Smart Distribution: Pokemon Name -> Valid Mega Stones
export const POKEMON_TO_MEGA_STONES: Record<string, string[]> = {
    'venusaur': ['venusaurite'],
    'charizard': ['charizardite-x', 'charizardite-y'],
    'blastoise': ['blastoisinite'],
    'beedrill': ['beedrillite'],
    'pidgeot': ['pidgeotite'],
    'alakazam': ['alakazite'],
    'slowbro': ['slowbronite'],
    'gengar': ['gengarite'],
    'kangaskhan': ['kangaskhanite'],
    'pinsir': ['pinsirite'],
    'gyarados': ['gyaradosite'],
    'aerodactyl': ['aerodactylite'],
    'mewtwo': ['mewtwonite-x', 'mewtwonite-y'],
    'ampharos': ['ampharosite'],
    'steelix': ['steelixite'],
    'scizor': ['scizorite'],
    'heracross': ['heracronite'],
    'houndoom': ['houndoominite'],
    'tyranitar': ['tyranitarite'],
    'sceptile': ['sceptilite'],
    'blaziken': ['blazikenite'],
    'swampert': ['swampertite'],
    'gardevoir': ['gardevoirite'],
    'sableye': ['sableyeite'],
    'mawile': ['mawileite'],
    'aggron': ['aggronite'],
    'medicham': ['medichamite'],
    'manectric': ['manectite'],
    'sharpedo': ['sharpedonite'],
    'camerupt': ['cameruptite'],
    'altaria': ['altarianite'],
    'banette': ['banettite'],
    'absol': ['absolite'],
    'glalie': ['glalitite'],
    'salamence': ['salamencite'],
    'metagross': ['metagrossite'],
    'latias': ['latiasite'],
    'latios': ['latiosite'],
    'lopunny': ['lopunnite'],
    'garchomp': ['garchompite'],
    'lucario': ['lucarionite'],
    'abomasnow': ['abomasite'],
    'gallade': ['galladite'],
    'audino': ['audinite'],
    'diancie': ['diancite']
};
