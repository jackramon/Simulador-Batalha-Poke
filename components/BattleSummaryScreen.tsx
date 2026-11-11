import React, { useMemo, useState } from 'react';
import { BattleState, Pokemon } from '../types';
import { computeBattleSummary, BattleSummaryData, PokemonHighlight } from '../utils/battleSummary';

interface BattleSummaryScreenProps {
  state: BattleState;
}

// ── Sub-componentes internos (não exportar) ──────────────────────────

const HpBar: React.FC<{ pokemon: Pokemon }> = ({ pokemon }) => {
  if (!pokemon) return null;
  const pct = pokemon?.maxHP > 0 ? Math.round((pokemon?.hp / pokemon?.maxHP) * 100) : 0;
  const barColor = pokemon?.isFainted
    ? 'bg-gray-400 dark:bg-gray-600'
    : pct > 50
      ? 'bg-green-500 dark:bg-green-400'
      : pct > 20
        ? 'bg-yellow-400 dark:bg-yellow-300'
        : 'bg-red-500 dark:bg-red-400';

  return (
    <div className="flex items-center gap-2 w-full">
      <img
        src={pokemon?.spriteUrl}
        alt={pokemon?.name ?? 'Pokémon'}
        className={`w-8 h-8 object-contain flex-shrink-0 ${pokemon?.isFainted ? 'grayscale opacity-40' : ''}`}
        onError={(e) => {
          if (pokemon?.fallbackUrls?.[0]) e.currentTarget.src = pokemon.fallbackUrls[0];
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className={`text-xs font-bold truncate ${pokemon?.isFainted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
            {pokemon?.name ?? 'Pokémon'}
          </span>
          <span className={`text-xs font-mono ml-1 flex-shrink-0 ${pokemon?.isFainted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
            {pokemon?.isFainted ? 'DESMAIOU' : `${pct}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 p-3 flex flex-col items-center justify-center gap-0.5 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium text-center leading-tight">{label}</span>
      <span className="text-lg font-black text-gray-800 dark:text-gray-100">{value}</span>
      {sub && <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center">{sub}</span>}
    </div>
  );
}

const HighlightCard: React.FC<{ highlight: PokemonHighlight }> = ({ highlight }) => {
  if (!highlight?.pokemon) return null;
  return (
    <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 p-3 flex items-center gap-3 shadow-sm">
      <img
        src={highlight.pokemon?.spriteUrl}
        alt={highlight.pokemon?.name ?? 'Pokémon'}
        className="w-12 h-12 object-contain flex-shrink-0"
        onError={(e) => {
          if (highlight.pokemon?.fallbackUrls?.[0])
            e.currentTarget.src = highlight.pokemon.fallbackUrls[0];
        }}
      />
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{highlight.label}</p>
        <p className="font-black text-gray-800 dark:text-gray-100 truncate">{highlight.pokemon?.name ?? 'Pokémon'}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{highlight.value}</p>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────

export function BattleSummaryScreen({ state }: BattleSummaryScreenProps) {
  const [open, setOpen] = useState(false);

  const summary: BattleSummaryData = useMemo(
    () => computeBattleSummary(state),
    // Computado uma única vez quando o winner é definido — state.turn é o discriminador
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.winner, state.turn]
  );

  const highlights = [
    summary.hero,
    summary.mostResilient,
    summary.leastEffective,
    summary.mostActive,
  ].filter((h): h is NonNullable<typeof h> => h !== null);

  return (
    <div className="mt-4 w-full">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl py-3 px-4 font-bold text-gray-700 dark:text-gray-200 shadow-sm transition-all"
      >
        <span className="text-lg">📊</span>
        {open ? 'Ocultar Resumo da Batalha' : 'Ver Resumo da Batalha'}
        <span className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Painel expandível */}
      {open && (
        <div className="mt-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-5 animate-fade-in">

          {/* ── Seção 1: Stats rápidos ── */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Visão Geral</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <StatCard icon="⏱️" label="Turnos" value={summary.totalTurns} />
              <StatCard icon="💥" label="Dano Total" value={summary.totalDamage.toLocaleString('pt-BR')} />
              <StatCard icon="💫" label="Críticos" value={summary.critCount} />
              <StatCard icon="🌬️" label="Falhas" value={summary.missCount} />
              <StatCard
                icon="🏆"
                label="Golpe Mais Usado"
                value={summary.mostUsedMove?.displayName ?? '—'}
                sub={summary.mostUsedMove ? `${summary.mostUsedMove.count}× utilizado` : undefined}
              />
            </div>
          </div>

          {/* ── Seção 2: HP por Time ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time P1 */}
            <div className="bg-white dark:bg-slate-700 rounded-xl border border-green-200 dark:border-green-900 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-green-700 dark:text-green-400 uppercase tracking-wide">
                  ⚔️ Jogador 1
                </h3>
                <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                  {summary.team1Fainted} desmaiados
                </span>
              </div>
              <div className="space-y-2">
                {state.team1.map((p, i) => <HpBar key={p?.id || i} pokemon={p} />)}
              </div>
              <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                HP médio restante: <strong>{Math.round(summary.team1AvgHpPercent)}%</strong>
              </p>
            </div>

            {/* Time P2 */}
            <div className="bg-white dark:bg-slate-700 rounded-xl border border-red-200 dark:border-red-900 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-wide">
                  🛡️ Jogador 2
                </h3>
                <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                  {summary.team2Fainted} desmaiados
                </span>
              </div>
              <div className="space-y-2">
                {state.team2.map((p, i) => <HpBar key={p?.id || i} pokemon={p} />)}
              </div>
              <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                HP médio restante: <strong>{Math.round(summary.team2AvgHpPercent)}%</strong>
              </p>
            </div>
          </div>

          {/* ── Seção 3: Destaques ── */}
          {highlights.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Destaques</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {highlights.map((h, i) => <HighlightCard key={i} highlight={h} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
