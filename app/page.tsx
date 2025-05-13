'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import { createDeck, dealCards } from './utils/deckUtils';
import { getAIDecision } from './utils/aiUtils';
import { determineWinner } from './utils/gameUtils';
import { GameState, TrucoState } from './types/game';

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
            trucoState: { type: 'CALLED', level, lastCaller: 'ai', cardIndex: aiDecision.cardIndex },
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

  const handleTruco = () => {
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
      trucoState: { type: 'CALLED', level: nextLevel, lastCaller: 'human' },
      message: `AI is thinking about ${nextLevel}...`,
      aiThinking: true
    }));

    // Simulate AI thinking about truco/retruco/vale4
    setTimeout(() => {
      // For now, randomly accept or reject
      const aiAccepts = Math.random() < 0.5;
      setGameState(prev => {
        const points = nextLevel === 'VALE4' ? 4 : 
                      nextLevel === 'RETRUCO' ? 3 : 2;
        const rejectedPoints = points - 1;

        return {
          ...prev,
          trucoState: aiAccepts 
            ? { type: 'ACCEPTED', level: nextLevel, lastCaller: 'human' }
            : { type: 'REJECTED', level: nextLevel, lastCaller: 'human' },
          message: aiAccepts 
            ? `AI accepted ${nextLevel}!` 
            : `AI rejected ${nextLevel}! You get ${rejectedPoints} points!`,
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
            trucoState: { type: 'ACCEPTED', level: prev.trucoState.level, lastCaller: 'ai' },
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
          trucoState: { type: 'ACCEPTED', level: prev.trucoState.level, lastCaller: 'ai' },
          aiCards: updatedAiCards,
          aiPlayedCard: selectedCard,
          playedCards: [selectedCard],
          phase: { type: 'HUMAN_TURN' },
          message: `AI played a card. Your turn!`,
          aiThinking: false
        };
      } else {
        // If rejected, determine points based on level
        const points = prev.trucoState.level === 'VALE4' ? 3 :
                      prev.trucoState.level === 'RETRUCO' ? 2 : 1;
        return {
          ...prev,
          trucoState: { type: 'REJECTED', level: prev.trucoState.level, lastCaller: 'ai' },
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
