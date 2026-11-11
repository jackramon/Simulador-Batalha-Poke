
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { ABILITY_EFFECTS } from '../../../../data/abilities';

/**
 * Habilidades que NÃO podem ser copiadas por Role Play (Gen 9).
 * Inclui habilidades de mudança de forma, únicas ou especiais.
 */
const BANNED_TARGET_ABILITIES = [
    'trace', 'wonder-guard', 'forecast', 'flower-gift', 'illusion', 
    'imposter', 'stance-change', 'power-of-alchemy', 'receiver', 
    'schooling', 'comatose', 'shields-down', 'disguise', 'rks-system', 
    'battle-bond', 'power-construct', 'ice-face', 'gulp-missile', 
    'neutralizing-gas', 'zen-mode', 'hunger-switch', 'as-one', 
    'zero-to-hero', 'commander', 'protosynthesis', 'quark-drive', 
    'orichalcum-pulse', 'hadron-engine', 'tera-shift', 'tera-shell', 
    'teraform-zero', 'poison-puppeteer'
];

/**
 * Habilidades que o USUÁRIO não pode substituir se as tiver.
 */
const BANNED_USER_ABILITIES = [
    'multitype', 'zen-mode', 'stance-change', 'schooling', 'comatose', 
    'shields-down', 'disguise', 'rks-system', 'battle-bond', 'power-construct', 
    'ice-face', 'gulp-missile', 'zero-to-hero', 'commander', 'protosynthesis', 
    'quark-drive', 'orichalcum-pulse', 'hadron-engine', 'tera-shift'
];

/**
 * Lógica para o movimento Representação (Role Play).
 * Regra Oficial: Substitui a Habilidade do usuário pela Habilidade do alvo.
 */
export function handleRolePlay(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se a habilidade do usuário é insubstituível
    if (BANNED_USER_ABILITIES.includes(attacker.ability)) {
        log(logs, `Mas falhou! A habilidade de ${attacker.name} não pode ser trocada.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica se a habilidade do alvo é incopiável
    if (BANNED_TARGET_ABILITIES.includes(defender.ability) || defender.ability === 'multitype') {
        log(logs, `Mas falhou! A habilidade de ${defender.name} não pode ser copiada.`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica se já possui a mesma habilidade
    if (attacker.ability === defender.ability) {
        log(logs, `Mas falhou! ${attacker.name} já tem a habilidade ${ABILITY_EFFECTS[defender.ability]?.name || defender.ability}.`, 'text-gray-500 italic');
        return;
    }

    // Executa a cópia
    const newAbilityName = ABILITY_EFFECTS[defender.ability]?.name || defender.ability;
    const oldAbilityName = ABILITY_EFFECTS[attacker.ability]?.name || attacker.ability;
    
    attacker.ability = defender.ability;

    log(logs, `${attacker.name} copiou a habilidade ${newAbilityName} de ${defender.name}!`, 'text-purple-600 font-bold italic');
    
    // Nota: Efeitos de entrada (OnEntry) como Intimidate geralmente ativam imediatamente após o Role Play
    // em jogos oficiais. No motor atual, gatilhos de habilidade são principalmente eventos.
    // Para simplificação 1v1, apenas a propriedade é alterada. 
    // Se necessário, uma chamada manual para EntryAbilities poderia ser feita aqui, 
    // mas requer cuidado com loops e contexto de estado.
}
