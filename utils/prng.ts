import type { BattlePRNGState, BattleState } from '../types';

const normalizeSeed = (seed: number): number => Math.trunc(seed) >>> 0;

export const createBattlePRNGState = (seed: number): BattlePRNGState => {
    const initialSeed = normalizeSeed(seed);
    return { seed: initialSeed, state: initialSeed, cursor: 0 };
};

export class BattlePRNG {
    private data: BattlePRNGState;
    private boundSnapshot?: BattlePRNGState;

    constructor(seed: number, snapshot?: BattlePRNGState) {
        const initialSeed = normalizeSeed(snapshot?.seed ?? seed);
        this.data = snapshot
            ? {
                seed: initialSeed,
                state: normalizeSeed(snapshot.state),
                cursor: Math.max(0, Math.trunc(snapshot.cursor)),
            }
            : { seed: initialSeed, state: initialSeed, cursor: 0 };
    }

    static fromBattleState(state: BattleState): BattlePRNG {
        if (!state.prngState) {
            state.prngState = createBattlePRNGState(state.turnSeed ?? state.seed ?? 0);
        }
        const prng = new BattlePRNG(state.prngState.seed, state.prngState);
        prng.boundSnapshot = state.prngState;
        return prng;
    }

    private syncBoundSnapshot(): void {
        if (this.boundSnapshot) Object.assign(this.boundSnapshot, this.data);
    }

    private syncFromBoundSnapshot(): void {
        if (this.boundSnapshot) this.data = { ...this.boundSnapshot };
    }

    attachTo(state: BattleState): BattlePRNG {
        this.syncFromBoundSnapshot();
        if (state.prngState && state.prngState !== this.boundSnapshot && state.prngState.cursor > this.data.cursor) {
            this.restore(state.prngState);
        }
        state.prngState = this.snapshot();
        this.boundSnapshot = state.prngState;
        return this;
    }

    next(): number {
        this.syncFromBoundSnapshot();
        this.data.state = normalizeSeed(this.data.state + 0x6D2B79F5);
        this.data.cursor += 1;
        let t = this.data.state;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        const value = ((t ^ t >>> 14) >>> 0) / 4294967296;
        this.syncBoundSnapshot();
        return value;
    }

    snapshot(): BattlePRNGState {
        return { ...this.data };
    }

    restore(snapshot: BattlePRNGState): void {
        this.data = {
            seed: normalizeSeed(snapshot.seed),
            state: normalizeSeed(snapshot.state),
            cursor: Math.max(0, Math.trunc(snapshot.cursor)),
        };
        this.syncBoundSnapshot();
    }

    fork(): BattlePRNG {
        return new BattlePRNG(this.data.seed, this.snapshot());
    }
}

export const nextBattleRandom = (state: BattleState | undefined, prng?: BattlePRNG): number => {
    if (prng) return prng.next();
    if (!state) throw new Error('A rolagem da batalha exige um PRNG ou BattleState explícito.');
    return BattlePRNG.fromBattleState(state).next();
};
