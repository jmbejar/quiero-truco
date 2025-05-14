import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useTrucoGame } from '../useTrucoGame';
import * as gameLogic from '../../utils/gameLogic';
import { GameState } from '../../types/game';

describe('useTrucoGame', () => {
  it('should initialize with default state and update on initializeGame', () => {
    const mockInitialState: GameState = {
      aiCards: [
        { number: 1, palo: 'oro' },
        { number: 2, palo: 'oro' },
        { number: 3, palo: 'oro' }
      ],
      humanCards: [
        { number: 4, palo: 'basto' },
        { number: 5, palo: 'basto' },
        { number: 6, palo: 'basto' }
      ],
      muestraCard: { number: 1, palo: 'oro' },
      humanPlayedCard: null,
      aiPlayedCard: null,
      deck: [],
      playedCards: [],
      phase: { type: 'HUMAN_TURN' },
      trucoState: { type: 'NONE', level: null, lastCaller: null },
      roundState: {
        humanStartsRound: true,
        lastTurnWinner: null,
        humanWins: 0,
        aiWins: 0,
        resultHistory: []
      },
      humanScore: 0,
      aiScore: 0,
      message: 'Test',
      aiThinking: false
    };
    jest.spyOn(gameLogic, 'getInitialGameState').mockImplementation(() => mockInitialState);
    const { result } = renderHook(() => useTrucoGame());
    expect(result.current.gameState.phase.type).toBe('INITIAL');
    act(() => {
      result.current.initializeGame();
    });
    expect(result.current.gameState.phase.type).toBe('HUMAN_TURN');
    expect(result.current.gameState.aiCards).toEqual(mockInitialState.aiCards);
    expect(result.current.gameState.humanCards).toEqual(mockInitialState.humanCards);
    expect(result.current.gameState.message).toBe('Test');
  });
}); 