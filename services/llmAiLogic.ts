import { Pokemon, Move, BattleState, PlayerInventory, Action } from '../types';

function extractJson(text: string): any {
    // Remove DeepSeek reasoning tags if present
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Try direct parsing first
    try {
        return JSON.parse(cleaned);
    } catch (_) {}

    // Remove markdown block tags if present
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (_) {}

    // Extract the content inside the first '{' and last '}' to handle preambles/safety notes
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        } catch (_) {}
    }

    throw new Error('Could not parse valid JSON from the LLM response: ' + text);
}

export async function decideLLMAction(
    attacker: Pokemon,
    defender: Pokemon,
    attackerTeam: Pokemon[],
    defenderTeam: Pokemon[],
    weather: string,
    moveLimitEnabled: boolean,
    inventory: PlayerInventory | undefined,
    terastallizationEnabled: boolean,
    teraUsed: boolean,
    state: BattleState,
    megaEvolutionEnabled: boolean,
    megaUsed: boolean,
    provider?: 'gemini' | 'openrouter' | 'deepseek',
    model?: string
): Promise<Action> {
    const playerNum = state?.currentPokemon1?.id === attacker.id ? 1 : 2;
    
    const prompt = `
Você é uma IA controlando um jogador em uma batalha Pokémon.
Analise o estado atual da batalha e decida a melhor ação.

Seu Pokémon Ativo:
Nome: ${attacker.name}
HP: ${attacker.hp}/${attacker.maxHP}
Tipos: ${attacker.types.join(', ')}
Habilidade: ${attacker.ability}
Item: ${attacker.heldItem || 'Nenhum'}
Status: ${Object.keys(attacker.statusEffects).join(', ') || 'Nenhum'}
Movimentos Disponíveis:
${attacker.moves.map(m => `- ${m.name} (Tipo: ${m.type}, Poder: ${m.power}, Precisão: ${m.accuracy}, PP: ${m.uses}/${m.maxUses})`).join('\n')}

Pokémon Oponente:
Nome: ${defender.name}
HP: ${defender.hp}/${defender.maxHP}
Tipos: ${defender.types.join(', ')}
Habilidade: ${defender.ability}
Status: ${Object.keys(defender.statusEffects).join(', ') || 'Nenhum'}

Clima Atual: ${weather}

Responda APENAS com um objeto JSON válido contendo a sua ação.
Formato esperado para atacar:
{
  "type": "move",
  "data": { "name": "nome-do-movimento" },
  "shouldTerastallize": false,
  "shouldMegaEvolve": false
}
Formato esperado para trocar:
{
  "type": "switch",
  "data": { "id": ID_DO_POKEMON_DA_EQUIPE }
}

Escolha a melhor ação para vencer a batalha.
`;

    try {
        const response = await fetch('/api/llm-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, provider, model })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch LLM action');
        }

        const data = await response.json();
        const action = extractJson(data.result);

        // Validar a ação
        if (action.type === 'move' && action.data) {
            const requestedName = String(action.data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const move = attacker.moves.find(m => {
                const moveName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                return moveName === requestedName || m.name.toLowerCase() === String(action.data.name).toLowerCase();
            });
            if (move) {
                return {
                    type: 'move',
                    data: move,
                    user: attacker,
                    playerNum,
                    priority: move.priority || 0,
                    shouldTerastallize: !!action.shouldTerastallize,
                    shouldMegaEvolve: !!action.shouldMegaEvolve
                };
            }
            
            // If the move exists but wasn't matched perfectly, fallback to first available move instead of throwing
            const fallbackMove = attacker.moves.filter(m => !moveLimitEnabled || m.uses > 0)[0];
            if (fallbackMove) {
                return {
                    type: 'move',
                    data: fallbackMove,
                    user: attacker,
                    playerNum,
                    priority: fallbackMove.priority || 0,
                    shouldTerastallize: !!action.shouldTerastallize,
                    shouldMegaEvolve: !!action.shouldMegaEvolve
                };
            }
        } else if (action.type === 'switch' && action.data) {
            const requestedId = action.data.id;
            const requestedName = String(action.data.name || action.data.id || '').toLowerCase().trim();
            
            const pkmn = attackerTeam.find(p => {
                if (p.hp <= 0 || p.id === attacker.id) return false;
                return (
                    p.id === requestedId ||
                    p.name.toLowerCase() === requestedName ||
                    String(p.id).toLowerCase() === requestedName ||
                    p.name.toLowerCase().includes(requestedName)
                );
            });
            if (pkmn) {
                return {
                    type: 'switch',
                    data: pkmn,
                    user: attacker,
                    playerNum,
                    priority: 6
                };
            }
        }

        // Ultimate fallback: return first available move rather than throwing an error
        const ultimateMoves = attacker.moves.filter(m => !moveLimitEnabled || m.uses > 0);
        if (ultimateMoves.length > 0) {
            return {
                type: 'move',
                data: ultimateMoves[0],
                user: attacker,
                playerNum,
                priority: ultimateMoves[0].priority || 0
            };
        }
        
        throw new Error('Invalid action from LLM');
    } catch (error) {
        console.error('LLM failed, falling back to basic logic', error);
        // Fallback to first available move
        const availableMoves = attacker.moves.filter(m => !moveLimitEnabled || m.uses > 0);
        if (availableMoves.length > 0) {
            return { type: 'move', data: availableMoves[0], user: attacker, playerNum, priority: availableMoves[0].priority || 0 };
        } else {
            // Struggle fallback
            return { type: 'move', data: { name: 'struggle', type: 'normal', power: 50, accuracy: 100, uses: 1, maxUses: 1, category: 'physical', description: '' }, user: attacker, playerNum, priority: 0 };
        }
    }
}
