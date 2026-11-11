import React, { useMemo, useState, useEffect } from 'react';
import { BattleState, Pokemon, StatStages } from '../types';
import { STATUS_TRANSLATIONS } from '../data/translations';
import { STAT_NAMES_PT } from '../data/pokemon';
// FIX #2: importar getRawStat para computar valores idênticos aos do card
import { getRawStat } from '../services/battleUtils';

interface InteractiveLogMessageProps {
  message: string;
  color: string;
  state: BattleState;
}

// Palavras-chave que indicam mudança real de stat no log
// FIX #3: usado para filtrar quando stat terms são adicionados ao regex
const STAT_CHANGE_KEYWORDS = [
  'aumentou', 'aumentou muito', 'aumentou drasticamente',
  'diminuiu', 'diminuiu muito', 'diminuiu drasticamente',
  'subiu', 'caiu', 'reduzido', 'aumentado'
];

// Multiplier de estágio para stats normais (ataque, defesa, etc.)
function getStageMult(stage: number): number {
  const n = stage > 0 ? 2 + stage : 2;
  const d = stage < 0 ? 2 - stage : 2;
  return n / d;
}

// Multiplier de estágio para precisão/evasão
function getAccEvaMult(stage: number): number {
  const n = stage > 0 ? 3 + stage : 3;
  const d = stage < 0 ? 3 - stage : 3;
  return n / d;
}

export const InteractiveLogMessage: React.FC<InteractiveLogMessageProps> = ({ message, color, state }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const parsedMessage = useMemo(() => {
    const terms: { type: string; text: string; data: any }[] = [];

    // ── Pokémon Names ─────────────────────────────────────────────────
    // FIX #4: separar team1 (verde) e team2 (vermelho)
    state.team1.forEach(p => {
      if (p) terms.push({ type: 'pokemon', text: p?.name ?? 'um Pokémon', data: { pokemon: p, team: 1 } });
    });
    state.team2.forEach(p => {
      if (p) terms.push({ type: 'pokemon', text: p?.name ?? 'um Pokémon', data: { pokemon: p, team: 2 } });
    });

    // ── Stats ─────────────────────────────────────────────────────────
    // FIX #3: SOMENTE adicionar stat terms se a mensagem contiver keyword de mudança.
    // Isso previne que nomes de golpes como "Ataque Rápido" sejam falsamente destacados.
    const lowerMsg = message.toLowerCase();
    const isStatChangeMsg = STAT_CHANGE_KEYWORDS.some(kw => lowerMsg.includes(kw));

    if (isStatChangeMsg) {
      Object.values(STAT_NAMES_PT).forEach(statName => {
        terms.push({ type: 'stat', text: statName, data: statName });
      });
    }

    // ── Status Conditions ─────────────────────────────────────────────
    const IGNORED_TERMS = ['Som', 'Carga', 'Sal', 'Recuo', 'Cura', 'Prioridade', 'Nada'];
    Object.entries(STATUS_TRANSLATIONS).forEach(([key, val]) => {
      if (!IGNORED_TERMS.includes(val?.name ?? '')) {
        terms.push({ type: 'status', text: val?.name ?? 'um status', data: { key, desc: val?.desc ?? 'Descrição indisponível' } });
      }
    });

    // Sort por comprimento decrescente para casar termos mais longos primeiro
    terms.sort((a, b) => b.text.length - a.text.length);

    if (terms.length === 0) return [{ type: 'text', content: message, id: 'text-0' }];

    // ── Regex e Split ─────────────────────────────────────────────────
    const escapedTerms = terms.map(t => t.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(
      `(?<=^|[^a-zA-ZÀ-ÿ])(${escapedTerms.join('|')})(?=[^a-zA-ZÀ-ÿ]|$)`,
      'g'
    );
    const parts = message.split(regex);

    // ── FIX #2: priorizar currentPokemon1/2 para sincronizar com o card ─
    // O card mostra os valores de currentPokemon1/2; a busca em team[] pode retornar
    // um objeto desatualizado se o state tiver desync entre currentPokemon e team[].
    const allForLookup: (Pokemon | null)[] = [
      state.currentPokemon1,
      state.currentPokemon2,
      ...state.team1,
      ...state.team2
    ];
    const mentionedPokemon = allForLookup
      .filter((p): p is Pokemon => p !== null && p !== undefined)
      .find(p => message.includes(p?.name ?? 'um Pokémon'));

    // Direção e magnitude da mudança de stat
    let change = 0;
    if (lowerMsg.includes('aumentou') || lowerMsg.includes('aumentado') || lowerMsg.includes('subiu')) {
      change = (lowerMsg.includes('drasticamente') || lowerMsg.includes('muito')) ? 2 : 1;
    } else if (lowerMsg.includes('diminuiu') || lowerMsg.includes('reduzido') || lowerMsg.includes('caiu')) {
      change = (lowerMsg.includes('drasticamente') || lowerMsg.includes('muito')) ? -2 : -1;
    }

    // ── Map parts to typed tokens ─────────────────────────────────────
    return parts.map((part, index) => {
      const termMatch = terms.find(t => t.text === part);

      if (!termMatch) {
        return { type: 'text', content: part, id: `${index}-${part}` };
      }

      let data = termMatch.data;

      if (termMatch.type === 'stat' && mentionedPokemon && change !== 0) {
        const statKey = Object.keys(STAT_NAMES_PT).find(
          k => STAT_NAMES_PT[k] === part
        ) as keyof StatStages | undefined;

        if (statKey) {
          const isAccEva = statKey === 'accuracy' || statKey === 'evasion';
          const currentStage = mentionedPokemon.statStages[statKey] ?? 0;
          const previousStage = Math.max(-6, Math.min(6, currentStage - change));

          // FIX #2: usar getRawStat para obter o valor exato exibido no card
          // (inclui habilidade, item, clima, terrain — idêntico ao PokemonCard)
          const currentValue = getRawStat(
            mentionedPokemon,
            statKey,
            state.weather,
            state.terrain
          );

          // Para previousValue: aplicar razão dos multipliers ao valor atual.
          // Fórmula: prevVal = currentVal × (prevMult / currentMult)
          // Isso preserva todos os modificadores absolutos (ability/item/weather)
          // e apenas troca o componente do estágio.
          let previousValue: number;
          if (isAccEva) {
            const ratio = getAccEvaMult(previousStage) / getAccEvaMult(currentStage);
            previousValue = Math.round(currentValue * ratio);
          } else {
            const ratio = getStageMult(previousStage) / getStageMult(currentStage);
            previousValue = Math.round(currentValue * ratio);
          }

          const difference = currentValue - previousValue;

          data = {
            statName: part,
            pokemonName: mentionedPokemon?.name ?? 'um Pokémon',
            // FIX #4 (também aplicado aqui para colorir título do tooltip):
            pokemonTeam: state.team1.some(p => p?.id === mentionedPokemon?.id) ? 1 : 2,
            currentStage,
            previousStage,
            currentValue,
            previousValue,
            difference,
            isAccEva,
            change
          };
        }
      }

      return { type: termMatch.type, content: part, data, id: `${index}-${part}` };
    });

  }, [message, state]);

  // ── Auto-dismiss e click global ───────────────────────────────────
  useEffect(() => {
    if (!activeModal) return;
    const handleClick = () => setActiveModal(null);
    const clickTimer = setTimeout(() => {
      window.addEventListener('click', handleClick);
    }, 10);
    const activePart = parsedMessage.find(p => p.id === activeModal);
    let duration = 4000;
    if (activePart) {
      if (activePart.type === 'pokemon') duration = 8000;
      if (activePart.type === 'stat')    duration = 7000;
      if (activePart.type === 'status')  duration = 5000;
    }
    const autoDismiss = setTimeout(() => setActiveModal(null), duration);
    return () => {
      clearTimeout(clickTimer);
      clearTimeout(autoDismiss);
      window.removeEventListener('click', handleClick);
    };
  }, [activeModal, parsedMessage]);

  const handleTermClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveModal(prev => (prev === id ? null : id));
  };

  return (
    <div className={`relative inline-block ${color}`}>
      {parsedMessage.map((part) => {
        if (part.type === 'text') {
          return <span key={part.id}>{part.content}</span>;
        }

        // FIX #4: cor do highlight baseada no tipo e time do Pokémon
        const highlightColor =
          part.type === 'pokemon'
            ? part.data.team === 1
              ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
              : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
            : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300';

        return (
          <React.Fragment key={part.id}>
            <span
              className={`underline decoration-dotted cursor-pointer font-semibold transition-colors ${highlightColor}`}
              onClick={(e) => handleTermClick(part.id, e)}
            >
              {part.content}
            </span>

            {/* ── Tooltip Modal ── */}
            {activeModal === part.id && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl p-5 max-w-sm w-full border border-gray-200 dark:border-slate-700 pointer-events-auto animate-fade-in">

                  {/* ── Header do modal ── */}
                  <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-slate-600 pb-2">
                    <h3 className={`font-black text-lg ${
                      part.type === 'pokemon'
                        ? (part.data.team === 1 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')
                        : 'text-indigo-800 dark:text-indigo-300'
                    }`}>
                      {part.type === 'pokemon' && `${part.data.pokemon?.name ?? 'um Pokémon'}`}
                      {part.type === 'stat' && (
                        part.data.pokemonName
                          ? `${part.data.statName} — ${part.data.pokemonName}`
                          : `Multiplicadores: ${part.data}`
                      )}
                      {part.type === 'status' && part.content}
                    </h3>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold leading-none ml-2"
                    >×</button>
                  </div>

                  {/* ══════════════════════════════════════════════════
                      TOOLTIP: POKÉMON
                      Exibe HP, time (P1/P2), ability, item, stages ativos
                  ═════════════════════════════════════════════════════ */}
                  {part.type === 'pokemon' && (() => {
                    const p: Pokemon | undefined = part.data.pokemon;
                    const teamLabel = part.data.team === 1 ? '👤 Jogador 1' : '🤖 Jogador 2';
                    const teamColor = part.data.team === 1 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
                    const hpPct = (p?.maxHP ?? 0) > 0 ? Math.round(((p?.hp ?? 0) / (p?.maxHP ?? 1)) * 100) : 0;
                    const hpBarColor = hpPct > 50 ? 'bg-green-500' : hpPct > 20 ? 'bg-yellow-400' : 'bg-red-500';
                    const activeStages = Object.entries(p?.statStages ?? {}).filter(([, v]) => v !== 0);
                    return (
                      <div className="flex flex-col gap-2 text-sm">
                        {/* Time e status de desmaio */}
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-xs uppercase ${teamColor}`}>{teamLabel}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p?.isFainted ? 'bg-gray-200 text-gray-500 dark:bg-gray-700' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'}`}>
                            {p?.isFainted ? 'Desmaiou' : 'Em campo'}
                          </span>
                        </div>

                        {/* HP */}
                        <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">PV</span>
                            <span className="font-black text-sm text-gray-800 dark:text-gray-100">
                              {p?.hp ?? 0} / {p?.maxHP ?? 0}
                              <span className="text-gray-400 ml-1 text-xs">({hpPct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div className={`h-2 rounded-full ${hpBarColor}`} style={{ width: `${hpPct}%` }} />
                          </div>
                        </div>

                        {/* Nível */}
                        <div className="flex justify-between bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Nível</span>
                          <span className="font-black text-gray-800 dark:text-gray-100">{p?.level ?? 50}</span>
                        </div>

                        {/* Habilidade */}
                        <div className="flex justify-between bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Habilidade</span>
                          <span className="font-black text-indigo-700 dark:text-indigo-300 text-xs text-right max-w-[60%]">{p?.ability ?? 'Nenhuma'}</span>
                        </div>

                        {/* Item */}
                        {p?.heldItem && (
                          <div className="flex justify-between bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700">
                            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">Item</span>
                            <span className="font-black text-amber-800 dark:text-amber-300 text-xs text-right max-w-[60%]">{p?.heldItem ?? 'Nenhum'}</span>
                          </div>
                        )}
                        {!p?.heldItem && (
                          <div className="flex justify-between bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg opacity-60">
                            <span className="text-gray-400 text-xs font-bold uppercase">Item</span>
                            <span className="text-gray-400 text-xs italic">Nenhum</span>
                          </div>
                        )}

                        {/* Estágios de stat ativos */}
                        {activeStages.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Modificadores de Atributo</p>
                            <div className="grid grid-cols-2 gap-1">
                              {activeStages.map(([stat, stage]) => {
                                const statNamePt = STAT_NAMES_PT[stat as keyof StatStages] || stat;
                                const stageNum = stage as number;
                                const stageColor = stageNum > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                                const sign = stageNum > 0 ? '+' : '';
                                return (
                                  <div key={stat} className="flex justify-between bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded border border-gray-200 dark:border-slate-600">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">{statNamePt}</span>
                                    <span className={`font-black text-xs ${stageColor}`}>{sign}{stageNum}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {activeStages.length === 0 && (
                          <p className="text-center text-gray-400 dark:text-gray-500 text-xs italic py-1">
                            Nenhum atributo modificado.
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* ══════════════════════════════════════════════════
                      TOOLTIP: STAT COM MUDANÇA (FIX #2 aplicado aqui)
                      Mostra: Valor Antes, Estágio, Alteração, Valor Final
                      Todos os valores sincronizados com getRawStat (= card)
                  ═════════════════════════════════════════════════════ */}
                  {part.type === 'stat' && part.data.pokemonName && (
                    <div className="flex flex-col gap-3">
                      {/* Identificação do Pokémon e direção */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                        part.data.pokemonTeam === 1
                          ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                      }`}>
                        <span className={`text-sm font-black ${
                          part.data.pokemonTeam === 1 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                        }`}>{part.data.pokemonName}</span>
                        <span className={`text-xl ${part.data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {part.data.change > 0 ? (part.data.change >= 2 ? '⬆⬆' : '⬆') : (part.data.change <= -2 ? '⬇⬇' : '⬇')}
                        </span>
                      </div>

                      {/* Antes / Estágio / Depois */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col bg-gray-50 dark:bg-slate-700 p-2 rounded-lg border border-gray-200 dark:border-slate-600">
                          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Valor Antes</span>
                          <span className="font-black text-gray-700 dark:text-gray-200 text-base">
                            {part.data.isAccEva ? `${part.data.previousValue}%` : part.data.previousValue}
                          </span>
                        </div>
                        <div className="flex flex-col bg-gray-50 dark:bg-slate-700 p-2 rounded-lg border border-gray-200 dark:border-slate-600">
                          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Estágio</span>
                          <span className="font-black text-gray-700 dark:text-gray-200 text-base">
                            <span className={part.data.previousStage !== 0 ? (part.data.previousStage > 0 ? 'text-green-600' : 'text-red-600') : ''}>
                              {part.data.previousStage > 0 ? '+' : ''}{part.data.previousStage}
                            </span>
                            <span className="text-indigo-400 mx-1 text-sm">→</span>
                            <span className={part.data.currentStage !== 0 ? (part.data.currentStage > 0 ? 'text-green-600' : 'text-red-600') : ''}>
                              {part.data.currentStage > 0 ? '+' : ''}{part.data.currentStage}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Alteração (diff) */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-lg border border-gray-200 dark:border-slate-600 relative overflow-hidden">
                        <div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold block">Alteração</span>
                          <span className={`font-black text-lg ${
                            part.data.difference > 0 ? 'text-green-600 dark:text-green-400'
                            : part.data.difference < 0 ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500'
                          }`}>
                            {part.data.difference > 0 ? '+' : ''}{part.data.difference}{part.data.isAccEva ? '%' : ''}
                          </span>
                        </div>
                        <div className={`absolute right-0 top-0 bottom-0 w-2 ${
                          part.data.difference > 0 ? 'bg-green-400' : part.data.difference < 0 ? 'bg-red-400' : 'bg-gray-300'
                        }`} />
                      </div>

                      {/* Valor Final — destaque em indigo */}
                      <div className="flex flex-col bg-indigo-600 dark:bg-indigo-700 p-3 rounded-lg border border-indigo-700 text-white shadow-inner">
                        <span className="text-xs text-indigo-200 uppercase font-bold">Valor Final (atual)</span>
                        <span className="font-black text-2xl">
                          {part.data.isAccEva ? `${part.data.currentValue}%` : part.data.currentValue}
                        </span>
                        <span className="text-xs text-indigo-300 mt-0.5">
                          Idêntico ao exibido no card do Pokémon
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════
                      TOOLTIP: STAT SEM MUDANÇA (tabela de multiplicadores)
                      Aparece apenas quando stat é clicado fora de contexto
                      de mudança (caso raro após FIX #3, mas mantido como fallback)
                  ═════════════════════════════════════════════════════ */}
                  {part.type === 'stat' && !part.data.pokemonName && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 bg-green-50 dark:bg-green-950 p-2 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-700 dark:text-green-400 font-bold text-xs border-b border-green-200 dark:border-green-700 pb-1 mb-1 uppercase">Aumentos</span>
                        {(part.data === 'Precisão' || part.data === 'Evasiva')
                          ? ['+1: 133%','+2: 166%','+3: 200%','+4: 233%','+5: 266%','+6: 300%'].map(t => (
                              <span key={t} className="text-green-600 dark:text-green-400 text-xs font-bold">{t}</span>
                            ))
                          : ['+1: ×1.50','+2: ×2.00','+3: ×2.50','+4: ×3.00','+5: ×3.50','+6: ×4.00'].map(t => (
                              <span key={t} className="text-green-600 dark:text-green-400 text-xs font-bold">{t}</span>
                            ))
                        }
                      </div>
                      <div className="flex flex-col gap-1 bg-red-50 dark:bg-red-950 p-2 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-700 dark:text-red-400 font-bold text-xs border-b border-red-200 dark:border-red-700 pb-1 mb-1 uppercase">Reduções</span>
                        {(part.data === 'Precisão' || part.data === 'Evasiva')
                          ? ['-1: 75%','-2: 60%','-3: 50%','-4: 42%','-5: 37%','-6: 33%'].map(t => (
                              <span key={t} className="text-red-600 dark:text-red-400 text-xs font-bold">{t}</span>
                            ))
                          : ['-1: ×0.66','-2: ×0.50','-3: ×0.40','-4: ×0.33','-5: ×0.28','-6: ×0.25'].map(t => (
                              <span key={t} className="text-red-600 dark:text-red-400 text-xs font-bold">{t}</span>
                            ))
                        }
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════
                      TOOLTIP: STATUS CONDITION
                  ═════════════════════════════════════════════════════ */}
                  {part.type === 'status' && (
                    <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                      {(part.data as { desc: string }).desc}
                    </div>
                  )}

                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
