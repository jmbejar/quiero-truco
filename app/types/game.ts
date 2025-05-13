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
export type TrucoState = {
  type: 'NONE' | 'CALLED' | 'ACCEPTED' | 'REJECTED';
  level: 'TRUCO' | 'RETRUCO' | 'VALE4' | null;
  lastCaller: 'human' | 'ai' | null;
  cardIndex?: number;  // Only needed when AI calls truco
};

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