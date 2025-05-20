import { getInitialGameState } from '../gameLogic';
import { GameState } from '../../types/game';
import * as deckUtils from '../deckUtils';
import * as gameUtils from '../gameUtils';

jest.mock('../deckUtils', () => ({
  createDeck: jest.fn(),
  dealCards: jest.fn()
}));

jest.mock('../gameUtils', () => ({
  determineWinner: jest.fn(),
  hasFlor: jest.fn()
}));

describe('getInitialGameState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (deckUtils.createDeck as jest.Mock).mockReturnValue([]);
    (deckUtils.dealCards as jest.Mock).mockReturnValue({
      topCards: [{ number: 1, palo: 'espada' }, { number: 2, palo: 'basto' }, { number: 3, palo: 'oro' }],
      bottomCards: [{ number: 4, palo: 'copa' }, { number: 5, palo: 'espada' }, { number: 6, palo: 'basto' }],
      remainingDeck: [{ number: 7, palo: 'oro' }]
    });
    (gameUtils.hasFlor as jest.Mock).mockReturnValue(false);
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
    (gameUtils.hasFlor as jest.Mock)
      .mockImplementation((cards) => 
        JSON.stringify(cards) === JSON.stringify([{ number: 4, palo: 'copa' }, { number: 5, palo: 'espada' }, { number: 6, palo: 'basto' }])
      );

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
    (gameUtils.hasFlor as jest.Mock)
      .mockImplementation((cards) => 
        JSON.stringify(cards) === JSON.stringify([{ number: 1, palo: 'espada' }, { number: 2, palo: 'basto' }, { number: 3, palo: 'oro' }])
      );

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
    (gameUtils.hasFlor as jest.Mock).mockReturnValue(true);

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
    expect(state.message).toContain('Ambos jugadores cantan flor');
  });
}); 