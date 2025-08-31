export interface Level {
  id: number;
  position: { x: number; y: number };
  isCompleted: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  stars: number;
  description: string;
  color?: string; // Tailwind gradient classes for distinct level colors
}

export enum LevelStatus {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
  COMPLETED = 'completed',
  CURRENT = 'current',
}