import { useState, useEffect, useCallback, useRef } from 'react';
import { getInitialGameState, getEndRoundState, getNextTurnState, getPlayerCardSelectState } from '../utils/gameLogic';
import { getAIDecision, getTrucoOfferAIDecision } from '../utils/aiUtils';
import { determineWinner } from '../utils/gameUtils';
import { GameState } from '../types/game';

export function useTrucoGame() {
  const [gameState, setGameState] = useState<GameState>({
    aiCards: [],
    humanCards: [],
    muestraCard: { number: 0, palo: 'oro' },
    humanPlayedCard: null,
    aiPlayedCard: null,
    playedCards: [],
    phase: { type: 'INITIAL' },
    trucoState: { type: 'NONE', level: null, lastCaller: null },
    roundState: {
      humanStartsRound: Math.random() < 0.5,
      lastTurnWinner: null,
      humanWins: 0,
      aiWins: 0,
      resultHistory: []
    },
    humanScore: 0,
    aiScore: 0,
    message: 'El juego está comenzando...'
  });

  const [nextTurnProgress, setNextTurnProgress] = useState(0);
  const nextTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextTurnAnimationRef = useRef<number | null>(null);

  const initializeGame = useCallback(() => {
    setGameState(prev => getInitialGameState(prev));
  }, []);

  const endRound = useCallback(() => {
    setGameState(prev => getEndRoundState(prev));
  }, []);

  const handleNextTurn = useCallback(() => {
    setGameState(prev => getNextTurnState(prev));
  }, []);

  const handlePlayerCardSelect = (index: number) => {
    setGameState(prev => getPlayerCardSelectState(prev, index));
  };

  const handleAITurn = useCallback(async () => {
    try {
      const aiDecision = await getAIDecision(
        gameState.humanPlayedCard,
        gameState.aiCards,
        gameState.muestraCard,
        gameState.phase,
        gameState.trucoState,
        gameState.playedCards,
      );
      setTimeout(() => {
        if (aiDecision.wantsTrucoAction && aiDecision.wantsTrucoAction.type !== 'NONE') {
          const level = aiDecision.wantsTrucoAction.type;
          setGameState(prev => ({
            ...prev,
            trucoState: { type: 'CALLED', level, lastCaller: 'AI', cardIndex: aiDecision.cardIndex },
            message: `Jugador CPU te canta: ¡${level}! ¿Aceptás?`
          }));
          return;
        }
        const cardIndex = Math.min(aiDecision.cardIndex, gameState.aiCards.length - 1);
        const selectedCard = gameState.aiCards[cardIndex];
        const updatedAiCards = [...gameState.aiCards];
        updatedAiCards.splice(cardIndex, 1);
        setGameState(prev => {
          if (prev.humanPlayedCard) {
            const playerWon = determineWinner(prev.humanPlayedCard, selectedCard, prev.muestraCard);
            const newResultHistory: ('win' | 'lose')[] = [...prev.roundState.resultHistory, playerWon ? 'win' : 'lose'];
            const playerWinsInRound = newResultHistory.filter(result => result === 'win').length;
            const aiWinsInRound = newResultHistory.filter(result => result === 'lose').length;
            const roundEnded = playerWinsInRound >= 2 || aiWinsInRound >= 2;
            const pointsToAward = prev.trucoState.type === 'ACCEPTED' && prev.trucoState.level ? 
              (prev.trucoState.level === 'VALE4' ? 4 :
               prev.trucoState.level === 'RETRUCO' ? 3 : 2) : 1;
            return {
              ...prev,
              aiCards: updatedAiCards,
              aiPlayedCard: selectedCard,
              playedCards: [...prev.playedCards, selectedCard],
              phase: roundEnded ? { type: 'ROUND_END' } : { type: 'SHOWING_PLAYED_CARDS' },
              message: roundEnded 
                ? (playerWinsInRound >= 2 ? `Ganaste la ronda! +${pointsToAward} puntos` : `El jugador CPU ganó la ronda! +${pointsToAward} puntos`)
                : (playerWon ? 'Ganaste esta mano!' : 'El jugador CPU ganó esta mano!'),
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
            aiCards: updatedAiCards,
            aiPlayedCard: selectedCard,
            playedCards: [selectedCard],
            phase: { type: 'HUMAN_TURN' },
            message: "Te toca jugar"
          };
        });
        if (updatedAiCards.length === 0 && gameState.humanCards.length === 0) {
          endRound();
        }
      }, 1500);
    } catch {
      const randomIndex = Math.floor(Math.random() * gameState.aiCards.length);
      const selectedCard = gameState.aiCards[randomIndex];
      const updatedAiCards = [...gameState.aiCards];
      updatedAiCards.splice(randomIndex, 1);
      setGameState(prev => {
        if (prev.humanPlayedCard) {
          const playerWon = determineWinner(prev.humanPlayedCard, selectedCard, prev.muestraCard);
          const newResultHistory: ('win' | 'lose')[] = [...prev.roundState.resultHistory, playerWon ? 'win' : 'lose'];
          const playerWinsInRound = newResultHistory.filter(result => result === 'win').length;
          const aiWinsInRound = newResultHistory.filter(result => result === 'lose').length;
          const roundEnded = playerWinsInRound >= 2 || aiWinsInRound >= 2;
          const pointsToAward = prev.trucoState.type === 'ACCEPTED' && prev.trucoState.level ? 
            (prev.trucoState.level === 'VALE4' ? 4 :
             prev.trucoState.level === 'RETRUCO' ? 3 : 2) : 1;
          return {
            ...prev,
            aiCards: updatedAiCards,
            aiPlayedCard: selectedCard,
            playedCards: [...prev.playedCards, selectedCard],
            phase: roundEnded ? { type: 'ROUND_END' } : { type: 'SHOWING_PLAYED_CARDS' },
            message: roundEnded 
              ? (playerWinsInRound >= 2 ? `Ganaste la ronda! +${pointsToAward} puntos` : `El jugador CPU ganó la ronda! +${pointsToAward} puntos`)
              : (playerWon ? 'Ganaste esta mano!' : 'El jugador CPU ganó esta mano!'),
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
          aiCards: updatedAiCards,
          aiPlayedCard: selectedCard,
          playedCards: [selectedCard],
          phase: { type: 'HUMAN_TURN' },
          message: "Te toca jugar"
        };
      });
    }
  }, [gameState, endRound]);

  const handleTruco = useCallback(async () => {
    if (gameState.phase.type !== 'HUMAN_TURN' || 
        (gameState.trucoState.type !== 'NONE' && 
         gameState.trucoState.type !== 'ACCEPTED')) return;
    const currentLevel = gameState.trucoState.level;
    const nextLevel = currentLevel === null ? 'TRUCO' :
                     currentLevel === 'TRUCO' ? 'RETRUCO' :
                     currentLevel === 'RETRUCO' ? 'VALE4' : null;
    if (!nextLevel) return;
    setGameState(prev => ({
      ...prev,
      trucoState: { type: 'CALLED', level: nextLevel, lastCaller: 'HUMAN' },
      message: `El jugador CPU está decidiendo si aceptar ${nextLevel}...`
    }));
    const aiDecision = await getTrucoOfferAIDecision(
      gameState.aiCards,
      gameState.humanCards,
      gameState.muestraCard,
      nextLevel,
      gameState.playedCards,
      gameState.roundState
    );
    if (aiDecision.action === 'accept') {
      setGameState(prev => {
        return {
          ...prev,
          trucoState: { type: 'ACCEPTED', level: nextLevel, lastCaller: 'HUMAN' },
          message: `Jugador CPU aceptó ${nextLevel}!`,
          phase: prev.phase,
          humanScore: prev.humanScore
        };
      });
    } else if (aiDecision.action === 'reject') {
      setGameState(prev => {
        const points = nextLevel === 'VALE4' ? 4 : 
                      nextLevel === 'RETRUCO' ? 3 : 2;
        const rejectedPoints = points - 1;
        return {
          ...prev,
          trucoState: { type: 'REJECTED', level: nextLevel, lastCaller: 'HUMAN' },
          message: `Jugador CPU rechazó ${nextLevel}! Tú recibes ${rejectedPoints} puntos!`,
          phase: { type: 'ROUND_END' },
          humanScore: prev.humanScore + rejectedPoints
        };
      });
    } else if (aiDecision.action === 'escalate') {
      let escalateLevel: 'RETRUCO' | 'VALE4' | null = null;
      if (nextLevel === 'TRUCO') escalateLevel = 'RETRUCO';
      else if (nextLevel === 'RETRUCO') escalateLevel = 'VALE4';
      if (!escalateLevel) return;
      setGameState(prev => ({
        ...prev,
        trucoState: { type: 'CALLED', level: escalateLevel, lastCaller: 'AI' },
        message: `Jugador CPU te canta: ¡${escalateLevel}! ¿Aceptás?`
      }));
    }
  }, [gameState]);

  const handleTrucoResponse = useCallback((action: 'accept' | 'reject' | 'escalate') => {
    setGameState(prev => {
      if (prev.trucoState.type !== 'CALLED' || !prev.trucoState.level) return prev;
      if (action === 'accept') {
        const cardIndex = prev.trucoState.cardIndex!;
        const selectedCard = prev.aiCards[cardIndex];
        const updatedAiCards = [...prev.aiCards];
        updatedAiCards.splice(cardIndex, 1);
        if (prev.humanPlayedCard) {
          const playerWon = determineWinner(prev.humanPlayedCard, selectedCard, prev.muestraCard);
          const newResultHistory: ('win' | 'lose')[] = [...prev.roundState.resultHistory, playerWon ? 'win' : 'lose'];
          const playerWinsInRound = newResultHistory.filter(result => result === 'win').length;
          const aiWinsInRound = newResultHistory.filter(result => result === 'lose').length;
          const roundEnded = playerWinsInRound >= 2 || aiWinsInRound >= 2;
          const pointsToAward = prev.trucoState.level === 'VALE4' ? 4 :
                               prev.trucoState.level === 'RETRUCO' ? 3 : 2;
          if (updatedAiCards.length === 0 && prev.humanCards.length === 0) {
            endRound();
          }
          return {
            ...prev,
            trucoState: { type: 'ACCEPTED', level: prev.trucoState.level, lastCaller: 'AI' },
            aiCards: updatedAiCards,
            aiPlayedCard: selectedCard,
            playedCards: [...prev.playedCards, selectedCard],
            phase: roundEnded ? { type: 'ROUND_END' } : { type: 'SHOWING_PLAYED_CARDS' },
            message: roundEnded 
              ? (playerWinsInRound >= 2 ? `Ganaste la ronda! +${pointsToAward} puntos` : `El jugador CPU ganó la ronda! +${pointsToAward} puntos`)
              : (playerWon ? 'Ganaste esta mano!' : 'El jugador CPU ganó esta mano!'),
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
          trucoState: { type: 'ACCEPTED', level: prev.trucoState.level, lastCaller: 'AI' },
          aiCards: updatedAiCards,
          aiPlayedCard: selectedCard,
          playedCards: [selectedCard],
          phase: { type: 'HUMAN_TURN' },
          message: '',
        };
      } else if (action === 'reject') {
        const points = prev.trucoState.level === 'VALE4' ? 3 :
                      prev.trucoState.level === 'RETRUCO' ? 2 : 1;
        return {
          ...prev,
          trucoState: { type: 'REJECTED', level: prev.trucoState.level, lastCaller: 'AI' },
          message: `Rechazaste ${prev.trucoState.level}! El jugador CPU recibe ${points} puntos.`,
          phase: { type: 'ROUND_END' },
          aiScore: prev.aiScore + points
        };
      } else if (action === 'escalate') {
        let escalateLevel: 'RETRUCO' | 'VALE4' | null = null;
        if (prev.trucoState.level === 'TRUCO') escalateLevel = 'RETRUCO';
        else if (prev.trucoState.level === 'RETRUCO') escalateLevel = 'VALE4';
        if (!escalateLevel) return prev;
        return {
          ...prev,
          trucoState: { type: 'CALLED', level: escalateLevel, lastCaller: 'HUMAN' },
          message: `El jugador CPU está decidiendo si aceptar ${escalateLevel}...`
        };
      }
      return prev;
    });
    if (action === 'escalate') {
      (async () => {
        let nextLevel: 'RETRUCO' | 'VALE4' | null = null;
        if (gameState.trucoState.level === 'TRUCO') nextLevel = 'RETRUCO';
        else if (gameState.trucoState.level === 'RETRUCO') nextLevel = 'VALE4';
        if (!nextLevel) return;
        const aiDecision = await getTrucoOfferAIDecision(
          gameState.aiCards,
          gameState.humanCards,
          gameState.muestraCard,
          nextLevel,
          gameState.playedCards,
          gameState.roundState
        );
        if (aiDecision.action === 'accept') {
          setGameState(prev => {
            return {
              ...prev,
              trucoState: { type: 'ACCEPTED', level: nextLevel, lastCaller: 'HUMAN' },
              message: `Jugador CPU aceptó ${nextLevel}!`,
              phase: prev.phase,
              humanScore: prev.humanScore
            };
          });
        } else if (aiDecision.action === 'reject') {
          setGameState(prev => {
            const points = nextLevel === 'VALE4' ? 4 : 
                          nextLevel === 'RETRUCO' ? 3 : 2;
            const rejectedPoints = points - 1;
            return {
              ...prev,
              trucoState: { type: 'REJECTED', level: nextLevel, lastCaller: 'HUMAN' },
              message: `Jugador CPU rechazó ${nextLevel}! Tú recibes ${rejectedPoints} puntos!`,
              phase: { type: 'ROUND_END' },
              humanScore: prev.humanScore + rejectedPoints
            };
          });
        } else if (aiDecision.action === 'escalate') {
          let escalateLevel: 'RETRUCO' | 'VALE4' | null = null;
          if (nextLevel === 'TRUCO') escalateLevel = 'RETRUCO';
          else if (nextLevel === 'RETRUCO') escalateLevel = 'VALE4';
          if (!escalateLevel) return;
          setGameState(prev => ({
            ...prev,
            trucoState: { type: 'CALLED', level: escalateLevel, lastCaller: 'AI' },
            message: `Jugador CPU te canta: ¡${escalateLevel}! ¿Aceptás?`
          }));
        }
      })();
    }
  }, [endRound, gameState]);

  useEffect(() => {
    if (gameState.phase.type === 'AI_TURN' && gameState.trucoState.type !== 'CALLED') {
      handleAITurn();
    }
  }, [gameState.phase.type, handleAITurn, gameState.trucoState.type]);

  useEffect(() => {
    if (gameState.phase.type === 'SHOWING_PLAYED_CARDS') {
      setNextTurnProgress(0);
      const start = performance.now();
      const duration = 3000.0;
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1.0);
        setNextTurnProgress(progress);
        if (progress < 1) {
          nextTurnAnimationRef.current = requestAnimationFrame(animate);
        }
      };
      nextTurnAnimationRef.current = requestAnimationFrame(animate);
      nextTurnTimeoutRef.current = setTimeout(() => {
        handleNextTurn();
      }, duration);
    } else {
      setNextTurnProgress(0);
      if (nextTurnTimeoutRef.current) {
        clearTimeout(nextTurnTimeoutRef.current);
        nextTurnTimeoutRef.current = null;
      }
      if (nextTurnAnimationRef.current) {
        cancelAnimationFrame(nextTurnAnimationRef.current);
        nextTurnAnimationRef.current = null;
      }
    }
    return () => {
      if (nextTurnTimeoutRef.current) {
        clearTimeout(nextTurnTimeoutRef.current);
        nextTurnTimeoutRef.current = null;
      }
      if (nextTurnAnimationRef.current) {
        cancelAnimationFrame(nextTurnAnimationRef.current);
        nextTurnAnimationRef.current = null;
      }
    };
  }, [gameState.phase.type, handleNextTurn]);

  return {
    gameState,
    setGameState,
    initializeGame,
    handleNextTurn,
    handlePlayerCardSelect,
    handleAITurn,
    handleTruco,
    handleTrucoResponse,
    nextTurnProgress
  };
} 