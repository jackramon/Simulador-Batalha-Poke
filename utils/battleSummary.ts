import { BattleState, Pokemon } from '../types';

export interface PokemonHighlight {
  pokemon: Pokemon;
  label: string;
  value: string;
}

export interface BattleSummaryData {
  totalTurns: number;
  totalDamage: number;
  critCount: number;
  missCount: number;
  faintCount: number;
  team1Fainted: number;
  team2Fainted: number;
  team1AvgHpPercent: number;
  team2AvgHpPercent: number;
  mostUsedMove: { displayName: string; count: number } | null;
  hero: PokemonHighlight | null;
  mostResilient: PokemonHighlight | null;
  leastEffective: PokemonHighlight | null;
  mostActive: PokemonHighlight | null;
}

function getTotalMovesUsed(pokemon: Pokemon): number {
  return pokemon.moves.reduce((sum, m) => sum + (m.maxUses - m.uses), 0);
}

function getHpPercent(pokemon: Pokemon): number {
  return pokemon.maxHP > 0 ? (pokemon.hp / pokemon.maxHP) * 100 : 0;
}

export function computeBattleSummary(state: BattleState): BattleSummaryData {
  const allPokemon = [...state.team1, ...state.team2];
  const logText = state.logs.map(l => l.message).join('\n');

  // ── Dano total (soma dos logs) ──────────────────────────────────────
  const simpleDmg = [...logText.matchAll(/Causou (\d+) de dano!/g)];
  const multiDmg  = [...logText.matchAll(/causou (\d+) de dano total!/g)];
  const totalDamage = [...simpleDmg, ...multiDmg]
    .reduce((sum, m) => sum + parseInt(m[1], 10), 0);

  // ── Acertos críticos, falhas, desmaiados ───────────────────────────
  const critCount  = (logText.match(/Um acerto crítico!/g) || []).length;
  const missCount  = (logText.match(/O ataque falhou!/g)   || []).length;
  const faintCount = (logText.match(/desmaiou!/g)          || []).length;

  // ── Stats por time ─────────────────────────────────────────────────
  const team1Fainted = state.team1.filter(p => p.isFainted).length;
  const team2Fainted = state.team2.filter(p => p.isFainted).length;
  const avg = (team: Pokemon[]) =>
    team.length > 0
      ? team.reduce((s, p) => s + getHpPercent(p), 0) / team.length
      : 0;
  const team1AvgHpPercent = avg(state.team1);
  const team2AvgHpPercent = avg(state.team2);

  // ── Golpe mais usado ────────────────────────────────────────────────
  const moveCounts: Record<string, { displayName: string; count: number }> = {};
  allPokemon.forEach(p =>
    p.moves.forEach(m => {
      const used = m.maxUses - m.uses;
      if (used > 0) {
        if (!moveCounts[m.name]) moveCounts[m.name] = { displayName: m.displayName, count: 0 };
        moveCounts[m.name].count += used;
      }
    })
  );
  const mostUsedMove = Object.values(moveCounts).sort((a, b) => b.count - a.count)[0] ?? null;

  // ── Herói da batalha ────────────────────────────────────────────────
  // Do time vencedor: Pokémon com mais golpes usados (maior contribuição ofensiva).
  // Empate: menor HP% restante (lutou mais duramente).
  let hero: PokemonHighlight | null = null;
  if (state.winner && state.winner !== 'draw') {
    const winTeam = state.winner === 1 ? state.team1 : state.team2;
    const heroP = [...winTeam].sort((a, b) => {
      const diff = getTotalMovesUsed(b) - getTotalMovesUsed(a);
      return diff !== 0 ? diff : getHpPercent(a) - getHpPercent(b);
    })[0];
    if (heroP) {
      hero = {
        pokemon: heroP,
        label: '⭐ Herói da Batalha',
        value: `${getTotalMovesUsed(heroP)} golpes usados`,
      };
    }
  }

  // ── Mais resistente ─────────────────────────────────────────────────
  // Pokémon sobrevivente de qualquer time com maior % de HP restante.
  const survivors = allPokemon.filter(p => !p.isFainted);
  const resilientP = survivors.sort((a, b) => getHpPercent(b) - getHpPercent(a))[0] ?? null;
  const mostResilient: PokemonHighlight | null = resilientP
    ? {
        pokemon: resilientP,
        label: '🛡️ Mais Resistente',
        value: `${Math.round(getHpPercent(resilientP))}% de HP restante`,
      }
    : null;

  // ── Menos efetivo ───────────────────────────────────────────────────
  // Do time PERDEDOR: Pokémon com maior % de HP restante
  // (ficou intacto enquanto o time foi derrotado = menor contribuição).
  // Em empate: Pokémon com mais HP% entre todos os sobreviventes de ambos os times.
  let leastEffective: PokemonHighlight | null = null;
  if (state.winner && state.winner !== 'draw') {
    const loseTeam = state.winner === 1 ? state.team2 : state.team1;
    const leastP = [...loseTeam].sort((a, b) => getHpPercent(b) - getHpPercent(a))[0];
    if (leastP) {
      leastEffective = {
        pokemon: leastP,
        label: '😴 Menos Efetivo',
        value: leastP.isFainted
          ? 'Desmaiou'
          : `${Math.round(getHpPercent(leastP))}% de HP — não precisou lutar`,
      };
    }
  }

  // ── Mais ativo (turnsActive) ────────────────────────────────────────
  const mostActiveP = [...allPokemon].sort((a, b) => b.turnsActive - a.turnsActive)[0] ?? null;
  const mostActive: PokemonHighlight | null = mostActiveP
    ? {
        pokemon: mostActiveP,
        label: '⚡ Mais Ativo',
        value: `${mostActiveP.turnsActive} turnos em campo`,
      }
    : null;

  return {
    totalTurns: state.turn,
    totalDamage,
    critCount,
    missCount,
    faintCount,
    team1Fainted,
    team2Fainted,
    team1AvgHpPercent,
    team2AvgHpPercent,
    mostUsedMove,
    hero,
    mostResilient,
    leastEffective,
    mostActive,
  };
}
