import { Card, GameState } from '../types/game';
import { createDeck, dealCards } from './deckUtils';
import { determineWinner, hasFlor } from './gameUtils';

function processFlorAndComposeMessage(
  bottomCards: Card[],
  topCards: Card[],
  humanStartsRound: boolean,
  muestraCard: Card
): { humanHasFlor: boolean; aiHasFlor: boolean; initialMessage: string } {
  const humanHasFlor = hasFlor(bottomCards, muestraCard);
  const aiHasFlor = hasFlor(topCards, muestraCard);

  let initialMessage = humanStartsRound ? '¡Tu turno! Selecciona una carta para jugar.' : 'Jugador CPU está pensando...';

  if (humanHasFlor && aiHasFlor) {
    initialMessage = 'Ambos jugadores cantan flor. 3 puntos para cada uno. ' + initialMessage;
  } else if (humanHasFlor) {
    initialMessage = '¡Cantaste flor! Ganas 3 puntos. ' + initialMessage;
  } else if (aiHasFlor) {
    initialMessage = 'El jugador CPU cantó flor. Gana 3 puntos. ' + initialMessage;
  }

  return { humanHasFlor, aiHasFlor, initialMessage };
}

export function getInitialGameState(prev: GameState): GameState {
  const fullDeck = createDeck();
  const { topCards, bottomCards, remainingDeck } = dealCards(fullDeck);
  const muestraIndex = Math.floor(Math.random() * remainingDeck.length);
  const muestraCard = remainingDeck[muestraIndex];
  remainingDeck.splice(muestraIndex, 1);

  const { humanHasFlor, aiHasFlor, initialMessage } = processFlorAndComposeMessage(
    bottomCards,
    topCards,
    prev.roundState.humanStartsRound,
    muestraCard
  );

  // Ensure original cards are also initialized and used correctly for flor calculation
  return {
    aiCards: topCards,
    humanCards: bottomCards,
    originalAiCards: [...topCards],
    originalHumanCards: [...bottomCards],
    muestraCard,
    humanPlayedCard: null, // Reset played cards at the start of a new round
    aiPlayedCard: null,    // Reset played cards at the start of a new round
    playedCards: [],
    phase: prev.roundState.humanStartsRound ? { type: 'HUMAN_TURN' } : { type: 'AI_TURN' },
    trucoState: { type: 'NONE', level: null, lastCaller: null },
    envidoState: { type: 'NONE', lastCaller: null, humanPoints: 0, aiPoints: 0 },
    roundState: {
      humanStartsRound: !prev.roundState.humanStartsRound,
      lastTurnWinner: null,
      humanWins: 0,
      aiWins: 0,
      resultHistory: []
    },
    humanScore: prev.humanScore + (humanHasFlor ? 3 : 0),
    aiScore: prev.aiScore + (aiHasFlor ? 3 : 0),
    message: initialMessage,
  };
}

export function getEndRoundState(prev: GameState): GameState {
  return {
    ...prev,
    phase: { type: 'ROUND_END' },
    message: 'No hay más cartas. Se terminó la ronda.'
  };
}

export function getNextTurnState(prev: GameState): GameState {
  const isFirstTurnInRound = prev.playedCards.length === 0;
  const playerPlaysFirst = isFirstTurnInRound 
    ? prev.roundState.humanStartsRound 
    : prev.roundState.lastTurnWinner === 'human';
  
  // Don't reset humanPlayedCard and aiPlayedCard to null
  // This keeps the cards visible on the board until they are replaced
  return {
    ...prev,
    phase: playerPlaysFirst ? { type: 'HUMAN_TURN' } : { type: 'AI_TURN' },
    message: playerPlaysFirst ? '¡Tu turno! Selecciona una carta para jugar.' : 'Jugador CPU está pensando...',
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
    message: 'Jugador CPU está pensando...',
  };
} 