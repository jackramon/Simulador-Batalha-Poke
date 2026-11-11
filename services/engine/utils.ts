
import type { LogEntry } from '../../types';

export type { LogEntry }; // Re-export para arquivos que importam daqui

export function log(logs: LogEntry[], message: string, color: string = 'text-gray-700') {
  logs.push({ message, color });
}
