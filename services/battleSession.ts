export interface TurnResolutionToken {
  sessionId: number;
  resolutionId: number;
  turn: number;
}

type InvalidationReason = 'invalidate' | 'terminate';
type InvalidationListener = (reason: InvalidationReason) => void;

interface TrackedTimer {
  cancel: () => void;
}

/**
 * Identifica a batalha dona de cada continuação e serializa as resoluções de turno.
 * Não contém regras de batalha nem consome PRNG.
 */
export class BattleSession {
  private currentSessionId = 0;
  private resolutionSequence = 0;
  private resolution: TurnResolutionToken | null = null;
  private terminalResolution: TurnResolutionToken | null = null;
  private active = true;
  private abortController = new AbortController();
  private timers = new Set<TrackedTimer>();
  private listeners = new Set<InvalidationListener>();

  get sessionId(): number {
    return this.currentSessionId;
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  get activeResolution(): TurnResolutionToken | null {
    return this.resolution;
  }

  beginSession(): number {
    this.invalidate();
    return this.currentSessionId;
  }

  invalidate(): void {
    this.currentSessionId += 1;
    this.active = true;
    this.cancelContinuations('invalidate');
  }

  terminate(): void {
    this.active = false;
    this.cancelContinuations('terminate');
  }

  isCurrent(sessionId: number): boolean {
    return this.active && this.currentSessionId === sessionId;
  }

  ownsSnapshot(sessionId: number): boolean {
    return this.currentSessionId === sessionId;
  }

  beginResolution(sessionId: number, turn: number): TurnResolutionToken | null {
    if (!this.isCurrent(sessionId) || this.resolution) return null;
    this.resolution = {
      sessionId,
      resolutionId: ++this.resolutionSequence,
      turn,
    };
    return this.resolution;
  }

  isResolutionCurrent(token: TurnResolutionToken): boolean {
    return this.isCurrent(token.sessionId)
      && this.resolution?.sessionId === token.sessionId
      && this.resolution.resolutionId === token.resolutionId;
  }

  canCommitResolution(token: TurnResolutionToken): boolean {
    if (!this.isCurrent(token.sessionId)) return false;
    return this.resolution
      ? this.resolution.resolutionId === token.resolutionId
      : this.resolutionSequence === token.resolutionId;
  }

  authorizeTerminalResolution(token: TurnResolutionToken): boolean {
    if (!this.isResolutionCurrent(token) || this.terminalResolution) return false;
    this.terminalResolution = token;
    return true;
  }

  canCommitTerminalResolution(token: TurnResolutionToken): boolean {
    return this.ownsSnapshot(token.sessionId)
      && this.terminalResolution?.sessionId === token.sessionId
      && this.terminalResolution.resolutionId === token.resolutionId;
  }

  finishResolution(token: TurnResolutionToken): void {
    if (this.resolution?.sessionId === token.sessionId
      && this.resolution.resolutionId === token.resolutionId) {
      this.resolution = null;
    }
  }

  schedule(sessionId: number, callback: () => void, delay: number): (() => void) | null {
    return this.trackTimer(sessionId, callback, delay, () => {});
  }

  wait(sessionId: number, delay: number): Promise<boolean> {
    if (!this.isCurrent(sessionId)) return Promise.resolve(false);
    return new Promise(resolve => {
      const cancel = this.trackTimer(sessionId, () => resolve(true), delay, () => resolve(false));
      if (!cancel) resolve(false);
    });
  }

  onInvalidate(listener: InvalidationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private trackTimer(
    sessionId: number,
    callback: () => void,
    delay: number,
    onCancel: () => void,
  ): (() => void) | null {
    if (!this.isCurrent(sessionId)) return null;
    let timeout: ReturnType<typeof setTimeout>;
    const tracked: TrackedTimer = {
      cancel: () => {
        clearTimeout(timeout);
        this.timers.delete(tracked);
        onCancel();
      },
    };
    timeout = setTimeout(() => {
      this.timers.delete(tracked);
      if (this.isCurrent(sessionId)) callback();
    }, delay);
    this.timers.add(tracked);
    return tracked.cancel;
  }

  private cancelContinuations(reason: InvalidationReason): void {
    this.resolution = null;
    if (reason === 'invalidate') this.terminalResolution = null;
    this.abortController.abort();
    this.abortController = new AbortController();
    const timers = [...this.timers];
    this.timers.clear();
    timers.forEach(timer => timer.cancel());
    [...this.listeners].forEach(listener => listener(reason));
  }
}
