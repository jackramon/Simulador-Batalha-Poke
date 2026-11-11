
import { ItemData } from './types';

export const BERRY_ITEMS: Record<string, ItemData & { targetType?: 'pokemon' | 'move' }> = {
  'sitrus-berry': { name: 'Fruta Sitrus', desc: 'Recupera um pouco de HP.', category: 'berry' },
  'lum-berry': { name: 'Fruta Lum', desc: 'Cura qualquer condição de status.', category: 'berry' },
  'leppa-berry': { name: 'Fruta Leppa', desc: 'Recupera 10 PP de um movimento.', category: 'berry', targetType: 'move', effectValue: 10 },
  'figy-berry': { name: 'Fruta Figy', desc: 'Recupera HP quando baixo.', category: 'berry' },
  'wiki-berry': { name: 'Fruta Wiki', desc: 'Recupera HP quando baixo.', category: 'berry' },
  'mago-berry': { name: 'Fruta Mago', desc: 'Recupera HP quando baixo.', category: 'berry' },
  'aguav-berry': { name: 'Fruta Aguav', desc: 'Recupera HP quando baixo.', category: 'berry' },
  'iapapa-berry': { name: 'Fruta Iapapa', desc: 'Recupera HP quando baixo.', category: 'berry' },
  'liechi-berry': { name: 'Fruta Liechi', desc: 'Aumenta Ataque quando HP está baixo.', category: 'berry' },
  'ganlon-berry': { name: 'Fruta Ganlon', desc: 'Aumenta Defesa quando HP está baixo.', category: 'berry' },
  'petaya-berry': { name: 'Fruta Petaya', desc: 'Aumenta Atq. Especial quando HP está baixo.', category: 'berry' },
  'apicot-berry': { name: 'Fruta Apicot', desc: 'Aumenta Def. Especial quando HP está baixo.', category: 'berry' },
  'salac-berry': { name: 'Fruta Salac', desc: 'Aumenta Velocidade quando HP está baixo.', category: 'berry' },
  'lansat-berry': { name: 'Fruta Lansat', desc: 'Aumenta taxa de crítico quando HP está baixo.', category: 'berry' },
  'starf-berry': { name: 'Fruta Starf', desc: 'Aumenta muito um atributo aleatório quando HP está baixo.', category: 'berry' },
  'micle-berry': { name: 'Fruta Micle', desc: 'Aumenta precisão no próximo movimento quando HP está baixo.', category: 'berry' },
  'custap-berry': { name: 'Fruta Custap', desc: 'Permite atacar primeiro quando HP está baixo.', category: 'berry' },
};
