
import { Pokemon, BattleState, LogEntry } from '../../../types';

export interface ContactEventPayload {
  attacker: Pokemon;
  defender: Pokemon;
  hitsLanded: number;
  logs: LogEntry[];
  state?: BattleState;
}

export type EventType = 'ON_CONTACT_HIT';

type Listener<T> = (payload: T) => void;

export class BattleEventBus {
  private listeners: Record<EventType, Listener<any>[]> = {
    'ON_CONTACT_HIT': []
  };

  subscribe(event: 'ON_CONTACT_HIT', callback: Listener<ContactEventPayload>): void {
    this.listeners[event].push(callback);
  }

  emit(event: 'ON_CONTACT_HIT', payload: ContactEventPayload): void {
    if (this.listeners[event]) {
        this.listeners[event].forEach(callback => callback(payload));
    }
  }
}
