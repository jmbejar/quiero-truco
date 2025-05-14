import { GameState } from '../types/game';
import { createDeck, dealCards } from './deckUtils';
import { determineWinner } from './gameUtils';

export function getInitialGameState(prev: GameState): GameState {
  const fullDeck = createDeck();
  const { topCards, bottomCards, remainingDeck } = dealCards(fullDeck);
  const muestraIndex = Math.floor(Math.random() * remainingDeck.length);
  const muestraCard = remainingDeck[muestraIndex];
  remainingDeck.splice(muestraIndex, 1);
  return {
    aiCards: topCards,
    humanCards: bottomCards,
    muestraCard,
    humanPlayedCard: null,
    aiPlayedCard: null,
    deck: remainingDeck,
    playedCards: [],
    phase: prev.roundState.humanStartsRound ? { type: 'HUMAN_TURN' } : { type: 'AI_TURN' },
    trucoState: { type: 'NONE', level: null, lastCaller: null },
    roundState: {
      humanStartsRound: !prev.roundState.humanStartsRound,
      lastTurnWinner: null,
      humanWins: 0,
      aiWins: 0,
      resultHistory: []
    },
    humanScore: prev.humanScore,
    aiScore: prev.aiScore,
    message: prev.roundState.humanStartsRound ? 'Your turn! Select a card to play.' : 'AI is thinking...',
    aiThinking: !prev.roundState.humanStartsRound
  };
}

export function getEndRoundState(prev: GameState): GameState {
  return {
    ...prev,
    phase: { type: 'ROUND_END' },
    message: 'Round Over! No more cards.'
  };
}

export function getNextTurnState(prev: GameState): GameState {
  const isFirstTurnInRound = prev.playedCards.length === 0;
  const playerPlaysFirst = isFirstTurnInRound 
    ? prev.roundState.humanStartsRound 
    : prev.roundState.lastTurnWinner === 'human';
  return {
    ...prev,
    humanPlayedCard: null,
    aiPlayedCard: null,
    phase: playerPlaysFirst ? { type: 'HUMAN_TURN' } : { type: 'AI_TURN' },
    message: playerPlaysFirst ? 'Your turn! Select a card to play.' : 'AI is thinking...',
    aiThinking: !playerPlaysFirst
  };
}

export function getPlayerCardSelectState(prev: GameState, index: number): GameState {
  if (prev.phase.type !== 'HUMAN_TURN') return prev;
  const selectedCard = prev.humanCards[index];
  const updatedHumanCards = [...prev.humanCards];
  updatedHumanCards.splice(index, 1);
  if (prev.aiPlayedCard) {
    const playerWon = determineWinner(selectedCard, prev.aiPlayedCard, prev.muestraCard);
    const newResultHistory: ('win' | 'lose')[] = [...prev.roundState.resultHistory, playerWon ? 'win' : 'lose'];
    const playerWinsInRound = newResultHistory.filter(result => result === 'win').length;
    const aiWinsInRound = newResultHistory.filter(result => result === 'lose').length;
    const roundEnded = playerWinsInRound >= 2 || aiWinsInRound >= 2;
    const pointsToAward = prev.trucoState.level === 'VALE4' ? 4 :
                         prev.trucoState.level === 'RETRUCO' ? 3 : 2;
    return {
      ...prev,
      humanCards: updatedHumanCards,
      humanPlayedCard: selectedCard,
      playedCards: [...prev.playedCards, selectedCard],
      phase: roundEnded ? { type: 'ROUND_END' } : { type: 'SHOWING_PLAYED_CARDS' },
      message: roundEnded 
        ? (playerWinsInRound >= 2 ? `You won the round! +${pointsToAward} points` : `AI won the round! +${pointsToAward} points`)
        : (playerWon ? 'You won this hand!' : 'AI won this hand!'),
      aiThinking: false,
      roundState: {
        ...prev.roundState,
        humanWins: playerWon ? prev.roundState.humanWins + 1 : prev.roundState.humanWins,
        aiWins: !playerWon ? prev.roundState.aiWins + 1 : prev.roundState.aiWins,
        resultHistory: newResultHistory,
        lastTurnWinner: playerWon ? 'human' : 'ai'
      },
      humanScore: roundEnded && playerWinsInRound >= 2 ? prev.humanScore + pointsToAward : prev.humanScore,
      aiScore: roundEnded && aiWinsInRound >= 2 ? prev.aiScore + pointsToAward : prev.aiScore
    };
  }
  return {
    ...prev,
    humanCards: updatedHumanCards,
    humanPlayedCard: selectedCard,
    playedCards: [selectedCard],
    phase: { type: 'AI_TURN' },
    message: 'AI is thinking...',
    aiThinking: true
  };
} 