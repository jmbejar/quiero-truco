export type Palo = "oro" | "basto" | "espada" | "copa";
export type Card = {
  number: number;
  palo: Palo;
}

// Game Phase States
export type GamePhase = 
  | { type: 'INITIAL' }
  | { type: 'HUMAN_TURN' }
  | { type: 'AI_TURN' }
  | { type: 'SHOWING_PLAYED_CARDS' }
  | { type: 'SHOWING_ENVIDO_POINTS' }
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
  lastCaller: 'HUMAN' | 'AI' | null;
  cardIndex?: number;  // Only needed when AI calls truco
};

// Envido States
export type EnvidoState = {
  type: 'NONE' | 'CALLED' | 'ACCEPTED' | 'REJECTED';
  lastCaller: 'HUMAN' | 'AI' | null;
  humanPoints?: number;
  aiPoints?: number;
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
  aiCards: Card[];
  humanCards: Card[];
  muestraCard: Card;
  humanPlayedCard: Card | null;
  aiPlayedCard: Card | null;
  playedCards: Card[];
  
  // Game phases
  phase: GamePhase;
  trucoState: TrucoState;
  envidoState: EnvidoState;
  roundState: RoundState;
  
  // Scores
  humanScore: number;
  aiScore: number;
  
  // UI state
  message: string;
}; 