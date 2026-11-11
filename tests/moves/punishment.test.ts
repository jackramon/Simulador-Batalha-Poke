import { describe, it, expect } from 'vitest';
import { getPunishmentPower } from '../../services/engine/handlers/moves/punishment';
import { createDummy } from '../factories';
import { LogEntry } from '../../types';

describe('Punishment', () => {
  it('deve retornar poder base (60) se o defensor não tiver boosts', () => {
    const defender = createDummy({ name: 'Defensor' });
    const logs: LogEntry[] = [];
    
    const power = getPunishmentPower(defender, 60, logs);
    
    expect(power).toBe(60);
  });

  it('deve aumentar o poder em 20 por estágio de boost', () => {
    const defender = createDummy({ name: 'Defensor', statStages: { accuracy: 0, evasion: 0, attack: 2, defense: 1, spAttack: 0, spDefense: 0, speed: 0 } });
    const logs: LogEntry[] = [];
    
    // 60 base + (3 boosts * 20) = 120
    const power = getPunishmentPower(defender, 60, logs);
    
    expect(power).toBe(120);
    expect(logs.some(l => l.message.includes('poder aumentou'))).toBe(true);
  });

  it('deve limitar o poder máximo a 200', () => {
    const defender = createDummy({ name: 'Defensor', statStages: { accuracy: 0, evasion: 0, attack: 6, defense: 6, spAttack: 0, spDefense: 0, speed: 0 } });
    const logs: LogEntry[] = [];
    
    // 60 base + (12 boosts * 20) = 300 -> Cap 200
    const power = getPunishmentPower(defender, 60, logs);
    
    expect(power).toBe(200);
  });

  it('não deve considerar reduções de stats (valores negativos)', () => {
    const defender = createDummy({ name: 'Defensor', statStages: { accuracy: 0, evasion: 0, attack: -2, defense: 1, spAttack: 0, spDefense: 0, speed: 0 } });
    const logs: LogEntry[] = [];
    
    // 60 base + (1 boost positivo * 20) = 80. Ignora o -2.
    const power = getPunishmentPower(defender, 60, logs);
    
    expect(power).toBe(80);
  });
});
