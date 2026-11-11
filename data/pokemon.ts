
export const STAT_NAMES_PT: Record<string, string> = {
  'accuracy': 'Precisão',
  'evasion': 'Evasiva',
  'attack': 'Ataque',
  'defense': 'Defesa',
  'spAttack': 'Atq. Especial',
  'spDefense': 'Def. Especial',
  'speed': 'Velocidade'
};

export const POKEMON_NAME_TRANSLATIONS: Record<string, string> = {
  'walking-wake': 'Onda Veloz',
  'iron-leaves': 'Folhas Férreas',
  'great-tusk': 'Presa Grande',
  'scream-tail': 'Cauda Berrante',
  'brute-bonnet': 'Gorro Bruto',
  'flutter-mane': 'Juba Melena',
  'slither-wing': 'Asa Rasteira',
  'sandy-shocks': 'Choque Areia',
  'iron-treads': 'Trilho Férreo',
  'iron-bundle': 'Pacote Férreo',
  'iron-hands': 'Mãos Férreas',
  'iron-jugulis': 'Pescoço Férreo',
  'iron-moth': 'Mariposa Férrea',
  'iron-thorns': 'Espinhos Férreos',
  'roaring-moon': 'Lua Rugidora',
  'iron-valiant': 'Valente Férreo',
  'gouging-fire': 'Fogo Perfurante',
  'raging-bolt': 'Raio Furioso',
  'iron-boulder': 'Pedregulho Férreo',
  'iron-crown': 'Coroa Férrea',
  'ting-lu': 'Ting-Lu',
  'chien-pao': 'Chien-Pao',
  'wo-chien': 'Wo-Chien',
  'chi-yu': 'Chi-Yu',
  'koraidon': 'Koraidon',
  'miraidon': 'Miraidon',
  'type-null': 'Tipo Nulo',
  'mr-mime': 'Mr. Mime',
  'mr-rime': 'Mr. Rime',
  'mime-jr': 'Mime Jr.',
  'tapu-koko': 'Tapu Koko',
  'tapu-lele': 'Tapu Lele',
  'tapu-bulu': 'Tapu Bulu',
  'tapu-fini': 'Tapu Fini',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o'
};

export const NAME_SUFFIX_TRANSLATIONS: Record<string, string> = {
  // Squawkabilly
  '-green-plumage': ' Plumagem Verde',
  '-blue-plumage': ' Plumagem Azul',
  '-yellow-plumage': ' Plumagem Amarela',
  '-white-plumage': ' Plumagem Branca',

  // Ogerpon
  '-teal-mask': ' Máscara Turquesa',
  '-wellspring-mask': ' Máscara da Nascente',
  '-hearthflame-mask': ' Máscara da Fornalha',
  '-cornerstone-mask': ' Máscara do Alicerce',

  // Forms & Regions
  '-alola': ' de Alola',
  '-galar': ' de Galar',
  '-hisui': ' de Hisui',
  '-paldea-combat': ' de Paldea (Combate)',
  '-paldea-blaze': ' de Paldea (Fogo)',
  '-paldea-aqua': ' de Paldea (Água)',
  '-combat-breed': ' (Combate)',
  '-blaze-breed': ' (Fogo)',
  '-aqua-breed': ' (Água)',
  '-paldea': ' de Paldea',
  
  // Megas & Gigas
  '-mega-x': ' Mega X',
  '-mega-y': ' Mega Y',
  '-mega': ' Mega',
  '-gmax': ' Gigamax',
  '-eternamax': ' Eternamax',
  '-primal': ' Primitivo',
  
  // Striped (Basculin)
  '-red-striped': ' Listra Vermelha',
  '-blue-striped': ' Listra Azul',
  '-white-striped': ' Listra Branca',
  
  // Rotom
  '-heat': ' Calor',
  '-wash': ' Lavagem',
  '-frost': ' Congelante',
  '-fan': ' Ventilador',
  '-mow': ' Cortador',
  
  // Oricorio
  '-baile': ' Baile',
  '-pom-pom': ' Pom-Pom',
  '-pau': ' Pa\'u',
  '-sensu': ' Sensu',
  
  // Lycanroc
  '-midday': ' Dia',
  '-midnight': ' Noite',
  '-dusk': ' Crepúsculo',
  
  // Urshifu
  '-rapid-strike': ' Golpe Fluido',
  '-single-strike': ' Golpe Singular',
  
  // Calyrex
  '-ice': ' Cavaleiro Glacial',
  '-shadow': ' Cavaleiro Espectral',
  
  // Toxtricity
  '-low-key': ' Grave',
  '-amped': ' Agudo',
  
  // Indeedee / Meowstic / Basculegion
  '-male': ' ♂',
  '-female': ' ♀',
  
  // Others
  '-origin': ' Origem',
  '-therian': ' Therian',
  '-incarnate': ' Encarnado',
  '-black': ' Preto',
  '-white': ' Branco',
  '-sunshine': ' Ensolarado',
  '-dawn': ' Amanhecer', // Necrozma
  '-ultra': ' Ultra', // Necrozma
  '-plant': ' Planta', // Burmy
  '-sandy': ' Areia', // Burmy
  '-trash': ' Lixo', // Burmy
  '-sky': ' Céu', // Shaymin
  '-attack': ' Ataque', // Deoxys
  '-defense': ' Defesa', // Deoxys
  '-speed': ' Velocidade', // Deoxys
  '-zen': ' Zen', // Darmanitan
  '-school': ' Cardume', // Wishiwashi
  '-totem': ' Totem',
  '-busted': ' Quebrado', // Mimikyu
  '-disguised': ' Disfarçado', // Mimikyu
  '-original': ' Original', // Magearna
  '-crowned': ' Coroado', // Zacian/Zamazenta
  '-full-belly': ' Barriga Cheia', // Morpeko
  '-hangry': ' Faminto', // Morpeko
  '-dada': ' Dadá', // Zarude
  '-bloodmoon': ' Lua de Sangue', // Ursaluna
  '-three-segment': ' Três Segmentos', // Dudunsparce
  '-two-segment': ' Dois Segmentos', // Dudunsparce
  '-family-of-three': ' Família de Três', // Maushold
  '-family-of-four': ' Família de Quatro', // Maushold
  '-stretchy': ' Elástico', // Tatsugiri
  '-droopy': ' Caído', // Tatsugiri
  '-curly': ' Encaracolado', // Tatsugiri
  '-roaming': ' Andarilho', // Gimmighoul
  '-chest': ' Baú', // Gimmighoul
  '-hero': ' Herói', // Palafin
  '-complete': ' Completo', // Zygarde
  '-resolute': ' Resoluto', // Keldeo
  '-pirouette': ' Pirueta', // Meloetta
  '-aria': ' Ária', // Meloetta
  '-ash': ' Ash', // Greninja
  '-battle-bond': ' Laço de Batalha', // Greninja
  '-own-tempo': ' Tempo Próprio', // Rockruff
  '-core': ' Núcleo', // Minior
  '-meteor': ' Meteoro', // Minior
  '-sunny': ' Forma Solar', // Castform
  '-rainy': ' Forma de Chuva', // Castform
  '-snowy': ' Forma de Neve', // Castform
  '-east': ' Mar Leste', // Gastrodon
  '-west': ' Mar Oeste', // Gastrodon
  '-terastal': ' Terastal', // Terapagos
  '-stellar': ' Estelar', // Terapagos
  '-counterfeit': ' Falsificado', // Poltchageist
  '-artisan': ' Artesão', // Poltchageist
  '-unremarkable': ' Comum', // Sinistcha
  '-masterpiece': ' Obra-Prima', // Sinistcha
  
  // Cleanup at the end
  '-standard': '', 
  '-normal': '',
  '-average': '',
  '-small': '',
  '-large': '',
  '-super': ''
};

// Constantes de Gênero
export const ALWAYS_FEMALE = [
  'chansey', 'blissey', 'kangaskhan', 'miltank', 'froslass', 'tinkaton', 
  'tinkatink', 'tinkatuff', 'happiny', 'smoochum', 'jynx', 'petilil', 
  'lilligant', 'vullaby', 'mandibuzz', 'flabebe', 'floette', 'florges', 
  'bounsweet', 'steenee', 'tsareena', 'salazzle', 'hatenna', 'hattrem', 
  'hatterene', 'milcery', 'alcremie', 'enamorus'
];

export const ALWAYS_MALE = [
  'tauros', 'gallade', 'braviary', 'grimmsnarl', 'nidoran-m', 'nidorino', 
  'nidoking', 'hitmonlee', 'hitmonchan', 'hitmontop', 'volbeat', 'mothim', 
  'rufflet', 'throh', 'sawk', 'landorus', 'thundurus', 'tornadus', 
  'morgrem', 'impidimp', 'okidogi', 'munkidori', 'fezandipiti'
];

export const ALWAYS_GENDERLESS = [
  'mewtwo', 'mew', 'magnemite', 'magneton', 'magnezone', 'voltorb', 
  'electrode', 'staryu', 'starmie', 'ditto', 'porygon', 'porygon2', 
  'porygon-z', 'shedinja', 'lunatone', 'solrock', 'baltoy', 'claydol', 
  'beldum', 'metang', 'metagross', 'regirock', 'regice', 'registeel', 
  'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys', 'dialga', 
  'palkia', 'giratina', 'darkrai', 'shaymin', 'arceus', 'victini', 
  'cobalion', 'terrakion', 'virizion', 'reshiram', 'zekrom', 'kyurem', 
  'keldeo', 'meloetta', 'genesect', 'xerneas', 'yveltal', 'zygarde', 
  'diancie', 'hoopa', 'volcanion', 'type-null', 'silvally', 'minior', 
  'dhelmise', 'cosmog', 'cosmoem', 'solgaleo', 'lunala', 'nihilego', 
  'buzzwole', 'pheromosa', 'xurkitree', 'celesteela', 'kartana', 
  'guzzlord', 'necrozma', 'magearna', 'marshadow', 'poipole', 
  'naganadel', 'stakataka', 'blacephalon', 'zeraora', 'meltan', 
  'melmetal', 'zacian', 'zamazenta', 'eternatus', 'kubfu', 'urshifu', 
  'zarude', 'regieleki', 'regidrago', 'glastrier', 'spectrier', 
  'calyrex', 'great-tusk', 'scream-tail', 'brute-bonnet', 'flutter-mane', 
  'slither-wing', 'sandy-shocks', 'iron-treads', 'iron-bundle', 
  'iron-hands', 'iron-jugulis', 'iron-moth', 'iron-thorns', 'roaring-moon', 
  'iron-valiant', 'koraidon', 'miraidon', 'walking-wake', 'iron-leaves', 
  'okidogi', 'munkidori', 'fezandipiti', 'pecharunt', 'iron-boulder', 
  'iron-crown', 'gouging-fire', 'raging-bolt', 'terapagos'
];
