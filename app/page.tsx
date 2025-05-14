'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './components/GameBoard';
import { createDeck, dealCards } from './utils/deckUtils';
import { getAIDecision, getTrucoOfferAIDecision } from './utils/aiUtils';
import { determineWinner } from './utils/gameUtils';
import { GameState } from './types/game';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    // Core game state
    aiCards: [],
    humanCards: [],
    muestraCard: { number: 0, palo: 'oro' },
    humanPlayedCard: null,
    aiPlayedCard: null,
    deck: [],
    playedCards: [],
    
    // Game phases
    phase: { type: 'INITIAL' },
    trucoState: { type: 'NONE', level: null, lastCaller: null },
    roundState: {
      humanStartsRound: Math.random() < 0.5,
      lastTurnWinner: null,
      humanWins: 0,
      aiWins: 0,
      resultHistory: []
    },
    
    // Scores
    humanScore: 0,
    aiScore: 0,
    
    // UI state
    message: 'Game starting...',
    aiThinking: false
  });

  // Timer and progress for Next Turn button
  const [nextTurnProgress, setNextTurnProgress] = useState(0);
  const nextTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextTurnAnimationRef = useRef<number | null>(null);

  // Initialize the game when the component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const fullDeck = createDeck();
    const { topCards, bottomCards, remainingDeck } = dealCards(fullDeck);
    
    // Get a random card from the remaining deck as the muestra
    const muestraIndex = Math.floor(Math.random() * remainingDeck.length);
    const muestraCard = remainingDeck[muestraIndex];
    remainingDeck.splice(muestraIndex, 1);
    
    setGameState(prev => ({
      // Core game state
      aiCards: topCards,
      humanCards: bottomCards,
      muestraCard,
      humanPlayedCard: null,
      aiPlayedCard: null,
      deck: remainingDeck,
      playedCards: [],
      
      // Game phases
      phase: prev.roundState.humanStartsRound ? { type: 'HUMAN_TURN' } : { type: 'AI_TURN' },
      trucoState: { type: 'NONE', level: null, lastCaller: null },
      roundState: {
        humanStartsRound: !prev.roundState.humanStartsRound,
        lastTurnWinner: null,
        humanWins: 0,
        aiWins: 0,
        resultHistory: []
      },
      
      // Scores
      humanScore: prev.humanScore,
      aiScore: prev.aiScore,
      
      // UI state
      message: prev.roundState.humanStartsRound ? 'Your turn! Select a card to play.' : 'AI is thinking...',
      aiThinking: !prev.roundState.humanStartsRound
    }));
  };

  const endRound = useCallback(() => {
    // This is now only used when the game ends due to no more cards
    setGameState(prev => ({
      ...prev,
      phase: { type: 'ROUND_END' },
      message: 'Round Over! No more cards.'
    }));
  }, []);

  const handleNextTurn = useCallback(() => {
    setGameState(prev => {
      // If this is the first turn in the round, use playerStartsRound
      // Otherwise, use lastTurnWinner to determine who plays first
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
      }});
    }, []);

  const handlePlayerCardSelect = (index: number) => {
    if (gameState.phase.type !== 'HUMAN_TURN') return;

    // Get the selected card and remove it from player's hand
    const selectedCard = gameState.humanCards[index];
    const updatedHumanCards = [...gameState.humanCards];
    updatedHumanCards.splice(index, 1);

    setGameState(prev => {
      // If AI has already played, determine the winner
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

      // If AI hasn't played yet, just update the state
      return {
        ...prev,
        humanCards: updatedHumanCards,
        humanPlayedCard: selectedCard,
        playedCards: [selectedCard],
        phase: { type: 'AI_TURN' },
        message: 'AI is thinking...',
        aiThinking: true
      };
    });
  };

  const handleAITurn = useCallback(async () => {
    console.log('AI turn started');
    try {
      // Get AI decision
      console.log('Calling getAIDecision with:', {
        playerPlayedCard: gameState.humanPlayedCard,
        topCards: gameState.aiCards,
        muestraCard: gameState.muestraCard,
        gamePhase: gameState.phase,
        trucoState: gameState.trucoState,
        playedCards: gameState.playedCards,
      });
      
      const aiDecision = await getAIDecision(
        gameState.humanPlayedCard,
        gameState.aiCards,
        gameState.muestraCard,
        gameState.phase,
        gameState.trucoState,
        gameState.playedCards,
      );
      
      console.log('AI decision received:', aiDecision);

      // Short delay to simulate thinking
      setTimeout(() => {
        console.log('AI timeout completed, processing decision');
        
        // If AI wants to call truco
        if (aiDecision.wantsTrucoAction && aiDecision.wantsTrucoAction.type !== 'NONE') {
          const level = aiDecision.wantsTrucoAction.type;
          setGameState(prev => ({
            ...prev,
            trucoState: { type: 'CALLED', level, lastCaller: 'AI', cardIndex: aiDecision.cardIndex },
            message: `AI says: ¡${level}! Do you accept?`,
            aiThinking: false
          }));
          return;
        }

        // Only play the card if AI didn't call truco
        const cardIndex = Math.min(aiDecision.cardIndex, gameState.aiCards.length - 1);
        const selectedCard = gameState.aiCards[cardIndex];
        const updatedAiCards = [...gameState.aiCards];
        updatedAiCards.splice(cardIndex, 1);

        console.log('AI selected card:', selectedCard, 'at index:', cardIndex);
        
        setGameState(prev => {
          // If player has already played, determine the winner
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

          // If player hasn't played yet, just update the state
          return {
            ...prev,
            aiCards: updatedAiCards,
            aiPlayedCard: selectedCard,
            playedCards: [selectedCard],
            phase: { type: 'HUMAN_TURN' },
            message: 'AI played a card. Your turn!',
            aiThinking: false
          };
        });

        // Check if game should end (no more cards)
        if (updatedAiCards.length === 0 && gameState.humanCards.length === 0) {
          console.log('Game ending condition met');
          endRound();
        }
      }, 1500);
    } catch (error) {
      console.error('Error during AI turn:', error);
      
      // Fallback to random play if AI fails
      const randomIndex = Math.floor(Math.random() * gameState.aiCards.length);
      const selectedCard = gameState.aiCards[randomIndex];
      const updatedAiCards = [...gameState.aiCards];
      updatedAiCards.splice(randomIndex, 1);

      console.log('AI fallback: selected random card at index:', randomIndex);
      
      setGameState(prev => {
        // If player has already played, determine the winner
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

        // If player hasn't played yet, just update the state
        return {
          ...prev,
          aiCards: updatedAiCards,
          aiPlayedCard: selectedCard,
          playedCards: [selectedCard],
          phase: { type: 'HUMAN_TURN' },
          message: 'AI played a card. Your turn!',
          aiThinking: false
        };
      });
    }
  }, [gameState, setGameState, endRound]);

  const handleTruco = async () => {
    if (gameState.phase.type !== 'HUMAN_TURN' || 
        (gameState.trucoState.type !== 'NONE' && 
         gameState.trucoState.type !== 'ACCEPTED')) return;

    const currentLevel = gameState.trucoState.level;
    const nextLevel = currentLevel === null ? 'TRUCO' :
                     currentLevel === 'TRUCO' ? 'RETRUCO' :
                     currentLevel === 'RETRUCO' ? 'VALE4' : null;

    if (!nextLevel) return; // Can't go higher than VALE4

    setGameState(prev => ({
      ...prev,
      trucoState: { type: 'CALLED', level: nextLevel, lastCaller: 'HUMAN' },
      message: `AI is thinking about ${nextLevel}...`,
      aiThinking: true
    }));

    // Call OpenAI to decide if AI accepts or rejects the truco offer
    const aiDecision = await getTrucoOfferAIDecision(
      gameState.aiCards,
      gameState.humanCards,
      gameState.muestraCard,
      nextLevel,
      gameState.playedCards,
      gameState.roundState
    );

    setGameState(prev => {
      const points = nextLevel === 'VALE4' ? 4 : 
                    nextLevel === 'RETRUCO' ? 3 : 2;
      const rejectedPoints = points - 1;

      return {
        ...prev,
        trucoState: aiDecision.accept 
          ? { type: 'ACCEPTED', level: nextLevel, lastCaller: 'HUMAN' }
          : { type: 'REJECTED', level: nextLevel, lastCaller: 'HUMAN' },
        message: aiDecision.accept
          ? `AI accepted ${nextLevel}!`
          : `AI rejected ${nextLevel}! You get ${rejectedPoints} points!`,
        aiThinking: false,
        // If rejected, end the round and give points to the player
        phase: aiDecision.accept ? prev.phase : { type: 'ROUND_END' },
        humanScore: aiDecision.accept ? prev.humanScore : prev.humanScore + rejectedPoints
      };
    });
  };

  const handleTrucoResponse = (accept: boolean) => {
    setGameState(prev => {
      if (prev.trucoState.type !== 'CALLED' || !prev.trucoState.level) return prev;

      if (accept) {
        // If player accepts, continue with AI's turn and play the card
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
          
          // Points are derived from the level
          const pointsToAward = prev.trucoState.level === 'VALE4' ? 4 :
                               prev.trucoState.level === 'RETRUCO' ? 3 : 2;

          // Check if game should end (no more cards)
          if (updatedAiCards.length === 0 && prev.humanCards.length === 0) {
            console.log('Game ending condition met');
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

        // If player hasn't played yet, just update the state
        return {
          ...prev,
          trucoState: { type: 'ACCEPTED', level: prev.trucoState.level, lastCaller: 'AI' },
          aiCards: updatedAiCards,
          aiPlayedCard: selectedCard,
          playedCards: [selectedCard],
          phase: { type: 'HUMAN_TURN' },
          message: '',
          aiThinking: false
        };
      } else {
        // If rejected, determine points based on level
        const points = prev.trucoState.level === 'VALE4' ? 3 :
                      prev.trucoState.level === 'RETRUCO' ? 2 : 1;
        return {
          ...prev,
          trucoState: { type: 'REJECTED', level: prev.trucoState.level, lastCaller: 'AI' },
          message: `You rejected ${prev.trucoState.level}! AI gets ${points} points.`,
          phase: { type: 'ROUND_END' },
          aiScore: prev.aiScore + points
        };
      }
    });
  };

  // AI turn logic
  useEffect(() => {
    if (gameState.phase.type === 'AI_TURN' && gameState.trucoState.type !== 'CALLED') {
      handleAITurn();
    }
  }, [gameState.phase.type, gameState.aiThinking, handleAITurn, gameState.trucoState.type]);

  // Timer and progress for Next Turn button
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-600">
      <h1 className="text-3xl font-bold text-white m-4">Quiero Truco</h1>
      <div className="flex flex-row w-full h-[90vh] bg-green-800 overflow-hidden">
        <div className="w-3/4 h-full flex items-center justify-center bg-transparent p-4">
          <GameBoard 
            topCards={gameState.aiCards} 
            bottomCards={gameState.humanCards} 
            middleCard={gameState.muestraCard}
            playerPlayedCard={gameState.humanPlayedCard}
            aiPlayedCard={gameState.aiPlayedCard}
            onPlayerCardSelect={handlePlayerCardSelect}
          />
        </div>
        <div className="w-1/4 h-full flex flex-col justify-between bg-gray-50 p-6 border-l border-gray-200">
          <div>
            <div className="text-lg font-semibold text-gray-800 mb-4 text-center min-h-[48px]">{gameState.message}</div>
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="flex gap-2">
                  {[0, 1, 2].map((index) => {
                    const result = gameState.roundState.resultHistory[index];
                    return (
                      <span key={index} className="flex items-center gap-1">
                        <span className={result === 'win' ? 'text-green-600' : result === 'lose' ? 'text-red-600' : 'text-gray-400'}>
                          {result === 'win' ? '✅' : result === 'lose' ? '❌' : '➖'}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            <div className="flex justify-center gap-8 mb-8">
              <div className="bg-green-100 rounded px-4 py-2 text-center w-24">
                <p className="font-bold text-green-800">You</p>
                <p className="text-2xl font-bold text-green-900">{gameState.humanScore}</p>
              </div>
              <div className="bg-gray-100 rounded px-4 py-2 text-center w-24">
                <p className="font-bold text-gray-800">AI</p>
                <p className="text-2xl font-bold text-gray-900">{gameState.aiScore}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 items-center">
            {gameState.phase.type === 'ROUND_END' && (
              <button 
                onClick={initializeGame}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Next Round
              </button>
            )}
            {gameState.phase.type === 'SHOWING_PLAYED_CARDS' && (
              <button 
                onClick={handleNextTurn}
                style={{
                  background: `linear-gradient(
                    to right,
                    rgb(191,219,254) 0%,
                    rgb(191,219,254) ${Math.round(nextTurnProgress * 100)}%,
                    rgb(59,130,246) ${Math.round(nextTurnProgress * 100)}%,
                    rgb(59,130,246) 100%
                  )`,
                  transition: 'background 0.2s linear'
                }}
                className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Next Turn
              </button>
            )}
            {/* Truco action buttons */}
            {gameState.phase.type === 'HUMAN_TURN' && (
              <div className="flex gap-4 w-full justify-center">
                {gameState.trucoState.type === 'NONE' && gameState.trucoState.lastCaller !== 'HUMAN' && (
                  <button
                    onClick={handleTruco}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                  >
                    Truco
                  </button>
                )}
                {gameState.trucoState.type === 'ACCEPTED' && gameState.trucoState.level === 'TRUCO' && gameState.trucoState.lastCaller !== 'HUMAN' && (
                  <button
                    onClick={handleTruco}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                  >
                    Retruco
                  </button>
                )}
                {gameState.trucoState.type === 'ACCEPTED' && gameState.trucoState.level === 'RETRUCO' && gameState.trucoState.lastCaller !== 'HUMAN' && (
                  <button
                    onClick={handleTruco}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                  >
                    Vale 4
                  </button>
                )}
              </div>
            )}
            {/* Truco response buttons */}
            {gameState.trucoState.type === 'CALLED' && gameState.trucoState.lastCaller === 'AI' && (
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => handleTrucoResponse(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full w-full"
                >
                  Quiero
                </button>
                <button
                  onClick={() => handleTrucoResponse(false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                >
                  No Quiero
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
