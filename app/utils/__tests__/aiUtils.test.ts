import { getAIDecision, getTrucoOfferAIDecision } from '../aiUtils';
import type { CardProps } from '../../components/Card';
import type { GamePhase, TrucoState, RoundState } from '../../types/game';

global.fetch = jest.fn();

describe('getAIDecision', () => {
  const mockCard: CardProps = { number: 7, palo: 'espada' };
  const opponentCards: CardProps[] = [mockCard, { number: 5, palo: 'basto' }];
  const middleCard: CardProps = { number: 1, palo: 'oro' };
  const gamePhase: GamePhase = { type: 'AI_TURN' };
  const trucoState: TrucoState = { type: 'NONE', level: null, lastCaller: null };
  const playedCards: CardProps[] = [];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns decision from API on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ decision: { cardIndex: 0, explanation: 'AI chose card 0' } }),
    });
    const decision = await getAIDecision(null, opponentCards, middleCard, gamePhase, trucoState, playedCards);
    expect(decision).toEqual({ cardIndex: 0, explanation: 'AI chose card 0' });
    expect(fetch).toHaveBeenCalled();
  });

  it('returns fallback decision on API error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));
    const decision = await getAIDecision(null, opponentCards, middleCard, gamePhase, trucoState, playedCards);
    expect(typeof decision.cardIndex).toBe('number');
    expect(decision.explanation).toMatch(/Random choice/);
  });

  it('returns fallback decision if API returns no decision', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });
    const decision = await getAIDecision(null, opponentCards, middleCard, gamePhase, trucoState, playedCards);
    expect(typeof decision.cardIndex).toBe('number');
    expect(decision.explanation).toMatch(/Random choice/);
  });
});

describe('getTrucoOfferAIDecision', () => {
  const aiCards: CardProps[] = [
    { number: 7, palo: 'espada' },
    { number: 5, palo: 'basto' },
  ];
  const humanCards: CardProps[] = [
    { number: 1, palo: 'oro' },
    { number: 3, palo: 'copa' },
  ];
  const muestraCard: CardProps = { number: 1, palo: 'espada' };
  const trucoLevel = 'TRUCO';
  const playedCards: CardProps[] = [];
  const roundState: RoundState = {
    humanStartsRound: true,
    lastTurnWinner: null,
    humanWins: 0,
    aiWins: 0,
    resultHistory: [],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns decision from API on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ decision: { action: 'accept', explanation: 'AI accepts' } }),
    });
    const decision = await getTrucoOfferAIDecision(aiCards, humanCards, muestraCard, trucoLevel, playedCards, roundState);
    expect(decision).toEqual({ action: 'accept', explanation: 'AI accepts' });
    expect(fetch).toHaveBeenCalled();
  });

  it('returns fallback decision on API error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));
    const decision = await getTrucoOfferAIDecision(aiCards, humanCards, muestraCard, trucoLevel, playedCards, roundState);
    expect(['accept', 'reject']).toContain(decision.action);
    expect(decision.explanation).toMatch(/Random choice/);
  });

  it('returns fallback decision if API returns no decision', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });
    const decision = await getTrucoOfferAIDecision(aiCards, humanCards, muestraCard, trucoLevel, playedCards, roundState);
    expect(['accept', 'reject']).toContain(decision.action);
    expect(decision.explanation).toMatch(/Random choice/);
  });
}); 