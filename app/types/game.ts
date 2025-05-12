import { CardProps } from '../components/Card';

// Game Phase States
export type GamePhase = 
  | { type: 'INITIAL' }
  | { type: 'HUMAN_TURN' }
  | { type: 'AI_TURN' }
  | { type: 'SHOWING_PLAYED_CARDS' }
  | { type: 'ROUND_END' };

// Available Truco Actions
export type AvailableTrucoAction = 
  | { type: 'NONE' }
  | { type: 'TRUCO' }
  | { type: 'RETRUCO' }
  | { type: 'VALE4' };

// Truco States
export type TrucoState = 
  | { type: 'NONE'; lastCaller: 'human' | 'ai' | null }
  | { type: 'HUMAN_TRUCO_CALLED' }
  | { type: 'AI_TRUCO_CALLED'; cardIndex: number }
  | { type: 'HUMAN_RETRUCO_CALLED' }
  | { type: 'AI_RETRUCO_CALLED'; cardIndex: number }
  | { type: 'HUMAN_VALE4_CALLED' }
  | { type: 'AI_VALE4_CALLED'; cardIndex: number }
  | { type: 'ACCEPTED'; points: 2 | 3 | 4; lastCaller: 'human' | 'ai' }
  | { type: 'REJECTED'; points: 1 | 2 | 3; lastCaller: 'human' | 'ai' };

// Round State
export type RoundState = {
  humanStartsRound: boolean;
  lastTurnWinner: 'human' | 'ai' | null;
  humanWins: number;
  aiWins: number;
  resultHistory: ('win' | 'lose')[];  // from human's perspective
};

// Game State
export type GameState = {
  // Core game state
  aiCards: CardProps[];
  humanCards: CardProps[];
  muestraCard: CardProps;
  humanPlayedCard: CardProps | null;
  aiPlayedCard: CardProps | null;
  deck: CardProps[];
  playedCards: CardProps[];
  
  // Game phases
  phase: GamePhase;
  trucoState: TrucoState;
  roundState: RoundState;
  
  // Scores
  humanScore: number;
  aiScore: number;
  
  // UI state
  message: string;
  aiThinking: boolean;
}; 