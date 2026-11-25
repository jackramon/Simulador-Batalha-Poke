import { describe, expect, it } from 'vitest';
import { BattleSession } from '../../services/battleSession';

describe('autorização do commit terminal', () => {
  it('reserva uma única entrega terminal e bloqueia commits comuns após terminate e finally', () => {
    const session = new BattleSession();
    const sessionId = session.beginSession();
    const resolution = session.beginResolution(sessionId, 18)!;

    expect(session.authorizeTerminalResolution(resolution)).toBe(true);
    expect(session.authorizeTerminalResolution(resolution)).toBe(false);

    session.terminate();
    session.finishResolution(resolution);

    expect(session.canCommitResolution(resolution)).toBe(false);
    expect(session.canCommitTerminalResolution(resolution)).toBe(true);
  });

  it('revoga a entrega antiga quando outra batalha começa', () => {
    const session = new BattleSession();
    const oldSessionId = session.beginSession();
    const oldResolution = session.beginResolution(oldSessionId, 18)!;
    expect(session.authorizeTerminalResolution(oldResolution)).toBe(true);
    session.terminate();
    session.finishResolution(oldResolution);

    const newSessionId = session.beginSession();

    expect(newSessionId).not.toBe(oldSessionId);
    expect(session.canCommitTerminalResolution(oldResolution)).toBe(false);
    expect(session.authorizeTerminalResolution(oldResolution)).toBe(false);
    expect(session.beginResolution(oldSessionId, 19)).toBeNull();
    expect(session.beginResolution(newSessionId, 1)).not.toBeNull();
  });
});
