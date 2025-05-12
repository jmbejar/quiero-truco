'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import { createDeck, dealCards } from './utils/deckUtils';
import { getAIDecision } from './utils/aiUtils';
import { determineWinner } from './utils/gameUtils';
import { AvailableTrucoAction, GameState, TrucoState } from './types/game';

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
    trucoState: { type: 'NONE', lastCaller: null },
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
      trucoState: { type: 'NONE', lastCaller: null },
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
      message: 'Game Over! No more cards.'
    }));
  }, []);

  const handleNextTurn = () => {
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
      };
    });
  };

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
        const pointsToAward = prev.trucoState.type === 'ACCEPTED' ? 2 : 1;

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
          let trucoState: TrucoState;
          let message: string;

          switch (aiDecision.wantsTrucoAction.type) {
            case 'VALE4':
              trucoState = { type: 'AI_VALE4_CALLED', cardIndex: aiDecision.cardIndex };
              message = 'AI says: ¡Vale 4! Do you accept?';
              break;
            case 'RETRUCO':
              trucoState = { type: 'AI_RETRUCO_CALLED', cardIndex: aiDecision.cardIndex };
              message = 'AI says: ¡Retruco! Do you accept?';
              break;
            case 'TRUCO':
              trucoState = { type: 'AI_TRUCO_CALLED', cardIndex: aiDecision.cardIndex };
              message = 'AI says: ¡Truco! Do you accept?';
              break;
            default:
              return;
          }

          setGameState(prev => ({
            ...prev,
            trucoState,
            message,
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
            const pointsToAward = prev.trucoState.type === 'ACCEPTED' ? 2 : 1;

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
            message: `AI played a card. ${aiDecision.explanation}. Your turn!`,
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
          const pointsToAward = prev.trucoState.type === 'ACCEPTED' ? 2 : 1;

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

  const handleTruco = () => {
    if (gameState.phase.type !== 'HUMAN_TURN' || 
        (gameState.trucoState.type !== 'NONE' && 
         gameState.trucoState.type !== 'ACCEPTED')) return;

    const isRetruco = gameState.trucoState.type === 'ACCEPTED' && gameState.trucoState.points === 2;
    const isVale4 = gameState.trucoState.type === 'ACCEPTED' && gameState.trucoState.points === 3;

    setGameState(prev => ({
      ...prev,
      trucoState: isVale4 ? { type: 'HUMAN_VALE4_CALLED' } :
                  isRetruco ? { type: 'HUMAN_RETRUCO_CALLED' } : 
                  { type: 'HUMAN_TRUCO_CALLED' },
      message: isVale4 ? 'AI is thinking about Vale 4...' :
               isRetruco ? 'AI is thinking about Retruco...' :
               'AI is thinking about Truco...',
      aiThinking: true
    }));

    // Simulate AI thinking about truco/retruco/vale4
    setTimeout(() => {
      // For now, randomly accept or reject
      const aiAccepts = Math.random() < 0.5;
      setGameState(prev => {
        const points = isVale4 ? 4 : isRetruco ? 3 : 2;
        const rejectedPoints = points - 1 as 1 | 2 | 3;
        return {
          ...prev,
          trucoState: aiAccepts ? { type: 'ACCEPTED', points, lastCaller: 'human' } : { type: 'REJECTED', points: rejectedPoints, lastCaller: 'human' },
          message: aiAccepts 
            ? `AI accepted ${isVale4 ? 'Vale 4' : isRetruco ? 'Retruco' : 'Truco'}!` 
            : `AI rejected ${isVale4 ? 'Vale 4' : isRetruco ? 'Retruco' : 'Truco'}! You get ${rejectedPoints} points!`,
          aiThinking: false,
          // If rejected, end the round and give points to the player
          phase: aiAccepts ? prev.phase : { type: 'ROUND_END' },
          humanScore: aiAccepts ? prev.humanScore : prev.humanScore + rejectedPoints
        };
      });
    }, 1500);
  };

  const handleTrucoResponse = (accept: boolean) => {
    setGameState(prev => {
      if (accept) {
        // If player accepts, continue with AI's turn and play the card
        if (prev.trucoState.type !== 'AI_TRUCO_CALLED' && 
            prev.trucoState.type !== 'AI_RETRUCO_CALLED' && 
            prev.trucoState.type !== 'AI_VALE4_CALLED') {
          return prev;
        }

        const cardIndex = Math.min(
          prev.trucoState.type === 'AI_TRUCO_CALLED' ? prev.trucoState.cardIndex :
          prev.trucoState.type === 'AI_RETRUCO_CALLED' ? prev.trucoState.cardIndex :
          prev.trucoState.cardIndex,
          prev.aiCards.length - 1
        );
        const selectedCard = prev.aiCards[cardIndex];
        const updatedAiCards = [...prev.aiCards];
        updatedAiCards.splice(cardIndex, 1);

        console.log('AI selected card:', selectedCard, 'at index:', cardIndex);
        
        if (prev.humanPlayedCard) {
          const playerWon = determineWinner(prev.humanPlayedCard, selectedCard, prev.muestraCard);
          const newResultHistory: ('win' | 'lose')[] = [...prev.roundState.resultHistory, playerWon ? 'win' : 'lose'];
          const playerWinsInRound = newResultHistory.filter(result => result === 'win').length;
          const aiWinsInRound = newResultHistory.filter(result => result === 'lose').length;
          const roundEnded = playerWinsInRound >= 2 || aiWinsInRound >= 2;
          
          // Determine points based on truco state
          const pointsToAward = prev.trucoState.type === 'AI_VALE4_CALLED' ? 4 :
                               prev.trucoState.type === 'AI_RETRUCO_CALLED' ? 3 :
                               prev.trucoState.type === 'AI_TRUCO_CALLED' ? 2 : 1;

          // Check if game should end (no more cards)
          if (updatedAiCards.length === 0 && prev.humanCards.length === 0) {
            console.log('Game ending condition met');
            endRound();
          }

          return {
            ...prev,
            trucoState: { type: 'ACCEPTED', points: pointsToAward as 2 | 3 | 4, lastCaller: 'ai' },
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
        const points = prev.trucoState.type === 'AI_VALE4_CALLED' ? 4 :
                      prev.trucoState.type === 'AI_RETRUCO_CALLED' ? 3 : 2;
        return {
          ...prev,
          trucoState: { type: 'ACCEPTED', points: points as 2 | 3 | 4, lastCaller: 'ai' },
          aiCards: updatedAiCards,
          aiPlayedCard: selectedCard,
          playedCards: [selectedCard],
          phase: { type: 'HUMAN_TURN' },
          message: `AI played a card. Your turn!`,
          aiThinking: false
        };
      } else {
        // If rejected, determine points based on truco state
        const points = prev.trucoState.type === 'AI_VALE4_CALLED' ? 3 :
                      prev.trucoState.type === 'AI_RETRUCO_CALLED' ? 2 : 1;
        return {
          ...prev,
          trucoState: { type: 'REJECTED', points: points as 1 | 2 | 3, lastCaller: 'ai' },
          message: `You rejected ${prev.trucoState.type === 'AI_VALE4_CALLED' ? 'Vale 4' : 
                                   prev.trucoState.type === 'AI_RETRUCO_CALLED' ? 'Retruco' : 
                                   'Truco'}! AI gets ${points} points.`,
          phase: { type: 'ROUND_END' },
          aiScore: prev.aiScore + points
        };
      }
    });
  };

  // AI turn logic
  useEffect(() => {
    if (gameState.phase.type === 'AI_TURN' && 
        gameState.trucoState.type !== 'AI_TRUCO_CALLED' && 
        gameState.trucoState.type !== 'AI_RETRUCO_CALLED' && 
        gameState.trucoState.type !== 'AI_VALE4_CALLED') {
      handleAITurn();
    }
  }, [gameState.phase.type, gameState.aiThinking, handleAITurn, gameState.trucoState.type]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-800 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">Quiero Truco</h1>
      
      <div className="bg-white rounded-lg p-3 mb-4 w-full max-w-4xl">
        <p className="text-center">{gameState.message}</p>
        {gameState.roundState.resultHistory.length > 0 && (
          <div className="text-center text-2xl mt-2">
            {gameState.roundState.resultHistory.map((result, index) => (
              <span key={index} className="mx-1">
                {result === 'win' ? '✅' : '❌'}
              </span>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-8 mt-2">
          <div className="text-center">
            <p className="font-bold">You</p>
            <p className="text-2xl">{gameState.humanScore}</p>
          </div>
          <div className="text-center">
            <p className="font-bold">AI</p>
            <p className="text-2xl">{gameState.aiScore}</p>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-4xl h-[60vh]">
        <GameBoard 
          topCards={gameState.aiCards} 
          bottomCards={gameState.humanCards} 
          middleCard={gameState.muestraCard}
          playerPlayedCard={gameState.humanPlayedCard}
          aiPlayedCard={gameState.aiPlayedCard}
          onPlayerCardSelect={handlePlayerCardSelect}
          onTruco={handleTruco}
          onTrucoResponse={handleTrucoResponse}
          trucoState={gameState.trucoState}
          gamePhase={gameState.phase}
        />
      </div>
      
      <div className="mt-6 flex gap-4">
        {gameState.phase.type === 'ROUND_END' && (
          <button 
            onClick={initializeGame}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Next Round
          </button>
        )}
        {gameState.phase.type === 'SHOWING_PLAYED_CARDS' && (
          <button 
            onClick={handleNextTurn}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Next Turn
          </button>
        )}
      </div>
    </div>
  );
}
