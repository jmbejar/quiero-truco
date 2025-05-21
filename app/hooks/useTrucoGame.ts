import { useState, useEffect, useCallback, useRef } from 'react';
import { getInitialGameState, getEndRoundState, getNextTurnState, getPlayerCardSelectState } from '../utils/gameLogic';
import { getAIDecision, getTrucoOfferAIDecision, getEnvidoOfferAIDecision } from '../utils/aiUtils';
import { determineWinner, hasFlor, calculateEnvidoPoints } from '../utils/gameUtils';
import { GameState } from '../types/game';

export function useTrucoGame() {
  const [gameState, setGameState] = useState<GameState>({
    aiCards: [],
    humanCards: [],
    originalAiCards: [],
    originalHumanCards: [],
    muestraCard: { number: 0, palo: 'oro' },
    humanPlayedCard: null,
    aiPlayedCard: null,
    playedCards: [],
    phase: { type: 'INITIAL' },
    trucoState: { type: 'NONE', level: null, lastCaller: null },
    envidoState: { type: 'NONE', lastCaller: null, humanPoints: 0, aiPoints: 0 },
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
        gameState.envidoState
      );
      setTimeout(() => {
        // Check if AI wants to offer envido
        if (aiDecision.wantsEnvido && gameState.playedCards.length === 0 && 
            gameState.envidoState.type === 'NONE' && gameState.trucoState.type === 'NONE') {
          // Calculate points for both players
          const humanEnvidoPoints = calculateEnvidoPoints(gameState.originalHumanCards, gameState.muestraCard);
          const aiEnvidoPoints = calculateEnvidoPoints(gameState.originalAiCards, gameState.muestraCard);
          
          setGameState(prev => ({
            ...prev,
            envidoState: { 
              type: 'CALLED', 
              lastCaller: 'AI',
              humanPoints: humanEnvidoPoints,
              aiPoints: aiEnvidoPoints 
            },
            message: 'El jugador CPU gritó envido! ¿Aceptás?'
          }));
          return;
        }

        // Check if AI wants to offer truco
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

  const handleEnvido = useCallback(async () => {
    // Can only offer envido in the first turn of a round and before truco
    const isHumanTurn = gameState.phase.type === 'HUMAN_TURN';
    const isEarlyInRound = gameState.playedCards.length === 0 || 
                          (gameState.playedCards.length === 1 && gameState.humanPlayedCard === null);
    const noEnvidoCalled = gameState.envidoState.type === 'NONE';
    const noTrucoCalled = gameState.trucoState.type === 'NONE';

    if (!isHumanTurn || !isEarlyInRound || !noEnvidoCalled || !noTrucoCalled) {
      console.error('Error: Attempted to offer envido in invalid game state. This should not be possible.');
      return;
    }
    
    // Cannot offer envido when someone has flor - use original cards for accurate flor detection
    const humanHasFlor = hasFlor(gameState.originalHumanCards, gameState.muestraCard);
    const aiHasFlor = hasFlor(gameState.originalAiCards, gameState.muestraCard);
    
    if (humanHasFlor || aiHasFlor) {
      console.error('Error: Attempted to offer envido when there is flor. This should not be possible.');
      setGameState(prev => ({
        ...prev,
        message: 'No se puede cantar envido cuando hay flor.'
      }));
      return;
    }

    
    // Calculate envido points - use original cards for accurate point calculation
    const humanEnvidoPoints = calculateEnvidoPoints(gameState.originalHumanCards, gameState.muestraCard);
    const aiEnvidoPoints = calculateEnvidoPoints(gameState.originalAiCards, gameState.muestraCard);
    
    setGameState(prev => ({
      ...prev,
      envidoState: { 
        type: 'CALLED', 
        lastCaller: 'HUMAN',
        humanPoints: humanEnvidoPoints,
        aiPoints: aiEnvidoPoints 
      },
      message: 'Gritaste envido! El jugador CPU está decidiendo...'
    }));

    const aiDecision = await getEnvidoOfferAIDecision(
      gameState.originalAiCards,
      gameState.originalHumanCards,
      gameState.muestraCard,
      gameState.playedCards,
      gameState.roundState
    );

    if (aiDecision.action === 'accept') {
      const humanPoints = calculateEnvidoPoints(gameState.originalHumanCards, gameState.muestraCard);
      
      setGameState(prev => ({
        ...prev,
        envidoState: { 
          type: 'ACCEPTED', 
          lastCaller: 'HUMAN', 
          humanPoints: humanPoints,
          aiPoints: aiDecision.points
        },
        phase: { type: 'SHOWING_ENVIDO_POINTS' },
        message: `Jugador CPU aceptó envido! Tus puntos: ${humanPoints}, CPU puntos: ${aiDecision.points}`
      }));

      // Set a timeout to continue the game after showing envido points
      setTimeout(() => {
        setGameState(prev => {
          const envidoWinner = prev.envidoState.humanPoints! > prev.envidoState.aiPoints! ? 'human' : 'ai';
          return {
            ...prev,
            phase: { type: 'HUMAN_TURN' },
            humanScore: envidoWinner === 'human' ? prev.humanScore + 2 : prev.humanScore,
            aiScore: envidoWinner === 'ai' ? prev.aiScore + 2 : prev.aiScore,
            message: envidoWinner === 'human' ? 
              'Ganaste el envido! +2 puntos. Te toca jugar.' : 
              'El jugador CPU ganó el envido! +2 puntos. Te toca jugar.'
          };
        });
      }, 3000);
    } else {
      setGameState(prev => ({
        ...prev,
        envidoState: { 
          type: 'REJECTED', 
          lastCaller: 'HUMAN',
          humanPoints: 0,
          aiPoints: 0
        },
        message: 'Jugador CPU rechazó envido! Tú recibes 1 punto.',
        humanScore: prev.humanScore + 1
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
        if (!nextLevel) {
          console.error('No next level found');
          return;
        }
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
          if (nextLevel !== 'RETRUCO') {
            console.error('Escalation invalid');
            return;
          }
          const escalateLevel = 'VALE4';
          setGameState(prev => ({
            ...prev,
            trucoState: { type: 'CALLED', level: escalateLevel, lastCaller: 'AI' },
            message: `Jugador CPU te canta: ¡${escalateLevel}! ¿Aceptás?`
          }));
        }
      })();
    }
  }, [endRound, gameState]);

  const handleEnvidoResponse = useCallback((action: 'accept' | 'reject') => {
    if (gameState.envidoState.type !== 'CALLED' || gameState.envidoState.lastCaller !== 'AI') return;
    
    if (action === 'accept') {
      const humanPoints = calculateEnvidoPoints(gameState.originalHumanCards, gameState.muestraCard);
      
      // Make AI calculate its points
      (async () => {
        const aiDecision = await getEnvidoOfferAIDecision(
          gameState.originalAiCards,
          gameState.originalHumanCards,
          gameState.muestraCard,
          gameState.playedCards,
          gameState.roundState
        );
        
        const aiPoints = aiDecision.points;
        
        setGameState(prev => ({
          ...prev,
          envidoState: { 
            type: 'ACCEPTED', 
            lastCaller: 'AI', 
            humanPoints: humanPoints,
            aiPoints: aiPoints
          },
          phase: { type: 'SHOWING_ENVIDO_POINTS' },
          message: `Aceptaste envido! Tus puntos: ${humanPoints}, CPU puntos: ${aiPoints}`
        }));
        
        // Set a timeout to continue the game after showing envido points
        setTimeout(() => {
          setGameState(prev => {
            const envidoWinner = prev.envidoState.humanPoints! > prev.envidoState.aiPoints! ? 'human' : 'ai';
            return {
              ...prev,
              phase: { type: 'HUMAN_TURN' },
              humanScore: envidoWinner === 'human' ? prev.humanScore + 2 : prev.humanScore,
              aiScore: envidoWinner === 'ai' ? prev.aiScore + 2 : prev.aiScore,
              message: envidoWinner === 'human' ? 
                'Ganaste el envido! +2 puntos. Te toca jugar.' : 
                'El jugador CPU ganó el envido! +2 puntos. Te toca jugar.'
            };
          });
        }, 3000);
      })();
    } else {
      setGameState(prev => ({
        ...prev,
        envidoState: { 
          type: 'REJECTED', 
          lastCaller: 'AI',
          humanPoints: 0,
          aiPoints: 0
        },
        message: 'Rechazaste envido! El jugador CPU recibe 1 punto.',
        aiScore: prev.aiScore + 1
      }));
    }
  }, [gameState]);

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
    handleEnvido,
    handleTrucoResponse,
    handleEnvidoResponse,
    nextTurnProgress
  };
} 