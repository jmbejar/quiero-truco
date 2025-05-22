import { getInitialGameState, checkGameOver } from '../gameLogic';
import { GameState } from '../../types/game';
import * as deckUtils from '../deckUtils';

jest.mock('../deckUtils', () => ({
  ...jest.requireActual('../deckUtils'),
  dealCards: jest.fn()
}));

describe('getInitialGameState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (deckUtils.dealCards as jest.Mock).mockReturnValue({
      topCards: [{ number: 1, palo: 'espada' }, { number: 2, palo: 'basto' }, { number: 3, palo: 'oro' }],
      bottomCards: [{ number: 4, palo: 'copa' }, { number: 5, palo: 'espada' }, { number: 6, palo: 'basto' }],
      remainingDeck: [{ number: 7, palo: 'oro' }]
    });
  });

  it('returns a valid initial game state with correct card counts', () => {
    const prev: Partial<GameState> = {
      roundState: {
        humanStartsRound: true,
        lastTurnWinner: null,
        humanWins: 0,
        aiWins: 0,
        resultHistory: []
      },
      humanScore: 0,
      aiScore: 0
    };
    const state = getInitialGameState(prev as GameState);
    expect(state.humanCards).toHaveLength(3);
    expect(state.aiCards).toHaveLength(3);
    expect(state.muestraCard).toBeDefined();
    expect(state.phase).toBeDefined();
    expect(state.trucoState).toBeDefined();
    expect(state.roundState).toBeDefined();
    expect(state.humanScore).toBe(0);
    expect(state.aiScore).toBe(0);
  });

  it('awards 3 points to human when only human has flor', () => {
    // Setup cards with flor for human player (all cards same suit)
    (deckUtils.dealCards as jest.Mock).mockReturnValue({
      topCards: [{ number: 1, palo: 'espada' }, { number: 2, palo: 'basto' }, { number: 3, palo: 'oro' }],
      bottomCards: [{ number: 4, palo: 'oro' }, { number: 5, palo: 'oro' }, { number: 6, palo: 'oro' }],
      remainingDeck: [{ number: 7, palo: 'copa' }]
    });

    const prev: Partial<GameState> = {
      roundState: {
        humanStartsRound: true,
        lastTurnWinner: null,
        humanWins: 0,
        aiWins: 0,
        resultHistory: []
      },
      humanScore: 5,
      aiScore: 3
    };
    
    const state = getInitialGameState(prev as GameState);
    
    expect(state.humanScore).toBe(8); // 5 + 3
    expect(state.aiScore).toBe(3);    // unchanged
    expect(state.message).toContain('¡Cantaste flor!');
  });

  it('awards 3 points to AI when only AI has flor', () => {
    // Setup cards with flor for AI player (all cards same suit)
    (deckUtils.dealCards as jest.Mock).mockReturnValue({
      topCards: [{ number: 1, palo: 'basto' }, { number: 2, palo: 'basto' }, { number: 3, palo: 'basto' }],
      bottomCards: [{ number: 4, palo: 'copa' }, { number: 5, palo: 'espada' }, { number: 6, palo: 'oro' }],
      remainingDeck: [{ number: 7, palo: 'oro' }]
    });

    const prev: Partial<GameState> = {
      roundState: {
        humanStartsRound: false,
        lastTurnWinner: null,
        humanWins: 0,
        aiWins: 0,
        resultHistory: []
      },
      humanScore: 2,
      aiScore: 7
    };
    
    const state = getInitialGameState(prev as GameState);
    
    expect(state.humanScore).toBe(2);  // unchanged
    expect(state.aiScore).toBe(10);    // 7 + 3
    expect(state.message).toContain('El jugador CPU cantó flor');
  });

  it('awards 3 points to both players when both have flor', () => {
    // Setup cards with flor for both players
    (deckUtils.dealCards as jest.Mock).mockReturnValue({
      topCards: [{ number: 1, palo: 'espada' }, { number: 2, palo: 'espada' }, { number: 3, palo: 'espada' }],
      bottomCards: [{ number: 4, palo: 'copa' }, { number: 5, palo: 'copa' }, { number: 6, palo: 'copa' }],
      remainingDeck: [{ number: 7, palo: 'oro' }]
    });

    const prev: Partial<GameState> = {
      roundState: {
        humanStartsRound: true,
        lastTurnWinner: null,
        humanWins: 0,
        aiWins: 0,
        resultHistory: []
      },
      humanScore: 10,
      aiScore: 12
    };
    
    const state = getInitialGameState(prev as GameState);
    
    expect(state.humanScore).toBe(13); // 10 + 3
    expect(state.aiScore).toBe(15);    // 12 + 3
    
    // Game should be over with AI as the winner since they reached 15 points
    expect(state.phase.type).toBe('GAME_OVER');
    expect((state.phase as { type: 'GAME_OVER', winner: 'human' | 'ai' }).winner).toBe('ai');
    expect(state.message).toContain('El jugador CPU ha ganado el juego con 15 puntos');
  });
});

describe('checkGameOver', () => {
  it('sets game phase to GAME_OVER when human score reaches 15', () => {
    const state: Partial<GameState> = {
      humanScore: 15,
      aiScore: 10,
      phase: { type: 'ROUND_END' },
      message: 'Round ended'
    };
    
    const result = checkGameOver(state as GameState);
    
    expect(result.phase.type).toBe('GAME_OVER');
    expect((result.phase as { type: 'GAME_OVER', winner: 'human' | 'ai' }).winner).toBe('human');
    expect(result.message).toContain('Has ganado el juego');
  });
  
  it('sets game phase to GAME_OVER when AI score reaches 15', () => {
    const state: Partial<GameState> = {
      humanScore: 10,
      aiScore: 15,
      phase: { type: 'ROUND_END' },
      message: 'Round ended'
    };
    
    const result = checkGameOver(state as GameState);
    
    expect(result.phase.type).toBe('GAME_OVER');
    expect((result.phase as { type: 'GAME_OVER', winner: 'human' | 'ai' }).winner).toBe('ai');
    expect(result.message).toContain('El jugador CPU ha ganado el juego');
  });
  
  it('does not change game phase when scores are below 15', () => {
    const state: Partial<GameState> = {
      humanScore: 14,
      aiScore: 14,
      phase: { type: 'ROUND_END' },
      message: 'Round ended'
    };
    
    const result = checkGameOver(state as GameState);
    
    expect(result).toBe(state);
    expect(result.phase.type).toBe('ROUND_END');
  });
}); 