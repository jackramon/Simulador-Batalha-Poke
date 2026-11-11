
export interface ItemData {
  name: string;
  desc: string;
  category: 'medicine' | 'battle-item' | 'berry' | 'held' | 'plate' | 'memory';
  effectValue?: number;
}
