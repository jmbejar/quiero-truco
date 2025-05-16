import { getInitialGameState } from '../gameLogic';
import { GameState } from '../../types/game';

describe('getInitialGameState', () => {
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
}); 