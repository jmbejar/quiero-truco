'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import { CardProps } from './components/Card';
import { createDeck, dealCards } from './utils/deckUtils';
import { getAIDecision } from './utils/aiUtils';
import { determineWinner } from './utils/gameUtils';

export default function Home() {
  const [gameState, setGameState] = useState<{
    topCards: CardProps[];
    bottomCards: CardProps[];
    muestraCard: CardProps;
    playerPlayedCard: CardProps | null;
    aiPlayedCard: CardProps | null;
    deck: CardProps[];
    playedCards: CardProps[];
    gamePhase: 'initial' | 'playerTurn' | 'aiTurn' | 'roundEnd';
    message: string;
    aiThinking: boolean;
    playerWins: number;
    aiWins: number;
    resultHistory: ('win' | 'lose')[];
  }>({
    topCards: [],
    bottomCards: [],
    muestraCard: { number: 0, palo: 'oro' },
    playerPlayedCard: null,
    aiPlayedCard: null,
    deck: [],
    playedCards: [],
    gamePhase: 'initial',
    message: 'Game starting...',
    aiThinking: false,
    playerWins: 0,
    aiWins: 0,
    resultHistory: []
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
    
    setGameState({
      topCards,
      bottomCards,
      muestraCard,
      playerPlayedCard: null,
      aiPlayedCard: null,
      deck: remainingDeck,
      playedCards: [],
      gamePhase: 'playerTurn',
      message: 'Your turn! Select a card to play.',
      aiThinking: false,
      playerWins: 0,
      aiWins: 0,
      resultHistory: []
    });
  };

  const endRound = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'roundEnd',
      message: 'Round ended! Click "New Game" to play again.'
    }));
  }, [setGameState]);

  const handleAITurn = useCallback(async () => {
    console.log('AI turn started');
    try {
      // Get AI decision
      console.log('Calling getAIDecision with:', {
        bottomCards: gameState.bottomCards,
        topCards: gameState.topCards,
        muestraCard: gameState.muestraCard,
        gamePhase: gameState.gamePhase
      });
      
      const aiDecision = await getAIDecision(
        gameState.bottomCards,
        gameState.topCards,
        gameState.muestraCard,
        gameState.gamePhase
      );
      
      console.log('AI decision received:', aiDecision);

      // Short delay to simulate thinking
      setTimeout(() => {
        console.log('AI timeout completed, processing decision');
        // Get the selected card and remove it from AI's hand
        const cardIndex = Math.min(aiDecision.cardIndex, gameState.topCards.length - 1);
        const selectedCard = gameState.topCards[cardIndex];
        const updatedTopCards = [...gameState.topCards];
        updatedTopCards.splice(cardIndex, 1);

        console.log('AI selected card:', selectedCard, 'at index:', cardIndex);
        
        // Determine winner of the round
        const playerWon = determineWinner(gameState.playerPlayedCard!, selectedCard, gameState.muestraCard);
        
        setGameState(prev => ({
          ...prev,
          topCards: updatedTopCards,
          aiPlayedCard: selectedCard,
          playedCards: [...prev.playedCards, selectedCard],
          gamePhase: 'playerTurn',
          message: `AI played a card. ${aiDecision.explanation}. Your turn!`,
          aiThinking: false,
          playerWins: playerWon ? prev.playerWins + 1 : prev.playerWins,
          aiWins: !playerWon ? prev.aiWins + 1 : prev.aiWins,
          resultHistory: [...prev.resultHistory, playerWon ? 'win' : 'lose']
        }));

        // Check if round should end
        if (updatedTopCards.length === 0 || gameState.bottomCards.length === 0) {
          console.log('Round ending condition met');
          endRound();
        }
      }, 1500);
    } catch (error) {
      console.error('Error during AI turn:', error);
      
      // Fallback to random play if AI fails
      const randomIndex = Math.floor(Math.random() * gameState.topCards.length);
      const selectedCard = gameState.topCards[randomIndex];
      const updatedTopCards = [...gameState.topCards];
      updatedTopCards.splice(randomIndex, 1);

      console.log('AI fallback: selected random card at index:', randomIndex);
      
      // Determine winner of the round
      const playerWon = determineWinner(gameState.playerPlayedCard!, selectedCard, gameState.muestraCard);
      
      setGameState(prev => ({
        ...prev,
        topCards: updatedTopCards,
        aiPlayedCard: selectedCard,
        playedCards: [...prev.playedCards, selectedCard],
        gamePhase: 'playerTurn',
        message: 'AI played a card. Your turn!',
        aiThinking: false,
        playerWins: playerWon ? prev.playerWins + 1 : prev.playerWins,
        aiWins: !playerWon ? prev.aiWins + 1 : prev.aiWins,
        resultHistory: [...prev.resultHistory, playerWon ? 'win' : 'lose']
      }));
    }
  }, [gameState, setGameState, endRound]);

  // AI turn logic
  useEffect(() => {
    if (gameState.gamePhase === 'aiTurn') {
      handleAITurn();
    }
  }, [gameState.gamePhase, gameState.aiThinking, handleAITurn]);

  const handlePlayerCardSelect = (index: number) => {
    if (gameState.gamePhase !== 'playerTurn') return;

    // Get the selected card and remove it from player's hand
    const selectedCard = gameState.bottomCards[index];
    const updatedBottomCards = [...gameState.bottomCards];
    updatedBottomCards.splice(index, 1);

    setGameState(prev => ({
      ...prev,
      bottomCards: updatedBottomCards,
      playerPlayedCard: selectedCard,
      playedCards: [...prev.playedCards, selectedCard],
      gamePhase: 'aiTurn',
      message: 'AI is thinking...',
      aiThinking: true
    }));
  };

  const clearPlayedCards = () => {
    if (gameState.playerPlayedCard && gameState.aiPlayedCard) {
      if (gameState.gamePhase === 'roundEnd') {
        initializeGame();
      } else {
        setGameState(prev => ({
          ...prev,
          playerPlayedCard: null,
          aiPlayedCard: null,
          message: 'Your turn! Select a card to play.'
        }));
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-800 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">Quiero Truco</h1>
      
      <div className="bg-white rounded-lg p-3 mb-4 w-full max-w-4xl">
        <p className="text-center">{gameState.message}</p>
        {gameState.resultHistory.length > 0 && (
          <div className="text-center text-2xl mt-2">
            {gameState.resultHistory.map((result, index) => (
              <span key={index} className="mx-1">
                {result === 'win' ? '✅' : '❌'}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="w-full max-w-4xl h-[60vh]">
        <GameBoard 
          topCards={gameState.topCards} 
          bottomCards={gameState.bottomCards} 
          middleCard={gameState.muestraCard}
          playerPlayedCard={gameState.playerPlayedCard}
          aiPlayedCard={gameState.aiPlayedCard}
          onPlayerCardSelect={handlePlayerCardSelect}
        />
      </div>
      
      <div className="mt-6 flex gap-4">
        {gameState.playerPlayedCard && gameState.aiPlayedCard && (
          <button 
            onClick={clearPlayedCards}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {gameState.gamePhase === 'roundEnd' ? 'Next Round' : 'Next Hand'}
          </button>
        )}
      </div>
    </div>
  );
}
