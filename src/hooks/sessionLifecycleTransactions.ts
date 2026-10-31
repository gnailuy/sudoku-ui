import type { GameAction } from '../api/types';

export interface PendingAction {
  sequence: number;
  action: GameAction;
}

export interface QueuedAction extends PendingAction {
  gameKey: string;
  resolve: (accepted: boolean) => void;
}

export type ActiveGameTransaction = 'applying-hint' | 'restarting-puzzle';
export type HintPreparation = 'preparing-hint' | 'refreshing-hint';
