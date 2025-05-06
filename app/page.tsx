'use client';

import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { CardProps } from './components/Card';
import { createDeck, dealCards } from './utils/deckUtils';
import { getAIDecision } from './utils/aiUtils';

export default function Home() {
  const [gameState, setGameState] = useState<{
    topCards: CardProps[];
    bottomCards: CardProps[];
    middleCard: CardProps | null;
    deck: CardProps[];
    playedCards: CardProps[];
    gamePhase: 'initial' | 'playerTurn' | 'aiTurn' | 'roundEnd';
    message: string;
    aiThinking: boolean;
  }>({
    topCards: [],
    bottomCards: [],
    middleCard: null,
    deck: [],
    playedCards: [],
    gamePhase: 'initial',
    message: 'Game starting...',
    aiThinking: false
  });

  // Initialize the game when the component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  // AI turn logic
  useEffect(() => {
    if (gameState.gamePhase === 'aiTurn' && !gameState.aiThinking) {
      handleAITurn();
    }
  }, [gameState.gamePhase, gameState.aiThinking]);

  const initializeGame = () => {
    const fullDeck = createDeck();
    const { topCards, bottomCards, remainingDeck } = dealCards(fullDeck);
    
    setGameState({
      topCards,
      bottomCards,
      middleCard: null,
      deck: remainingDeck,
      playedCards: [],
      gamePhase: 'playerTurn',
      message: 'Your turn! Select a card to play.',
      aiThinking: false
    });
  };

  const handlePlayerCardSelect = (index: number) => {
    if (gameState.gamePhase !== 'playerTurn') return;

    // Get the selected card and remove it from player's hand
    const selectedCard = gameState.bottomCards[index];
    const updatedBottomCards = [...gameState.bottomCards];
    updatedBottomCards.splice(index, 1);

    setGameState(prev => ({
      ...prev,
      bottomCards: updatedBottomCards,
      middleCard: selectedCard,
      playedCards: [...prev.playedCards, selectedCard],
      gamePhase: 'aiTurn',
      message: 'AI is thinking...',
      aiThinking: true
    }));
  };

  const handleAITurn = async () => {
    try {
      // Get AI decision
      const aiDecision = await getAIDecision(
        gameState.bottomCards,
        gameState.topCards,
        gameState.middleCard || { number: 0, palo: 'oro' },
        gameState.gamePhase
      );

      // Short delay to simulate thinking
      setTimeout(() => {
        // Get the selected card and remove it from AI's hand
        const cardIndex = Math.min(aiDecision.cardIndex, gameState.topCards.length - 1);
        const selectedCard = gameState.topCards[cardIndex];
        const updatedTopCards = [...gameState.topCards];
        updatedTopCards.splice(cardIndex, 1);

        setGameState(prev => ({
          ...prev,
          topCards: updatedTopCards,
          middleCard: selectedCard,
          playedCards: [...prev.playedCards, selectedCard],
          gamePhase: 'playerTurn',
          message: `AI played a card. ${aiDecision.explanation}. Your turn!`,
          aiThinking: false
        }));

        // Check if round should end
        if (updatedTopCards.length === 0 || gameState.bottomCards.length === 0) {
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

      setGameState(prev => ({
        ...prev,
        topCards: updatedTopCards,
        middleCard: selectedCard,
        playedCards: [...prev.playedCards, selectedCard],
        gamePhase: 'playerTurn',
        message: 'AI played a card. Your turn!',
        aiThinking: false
      }));
    }
  };

  const endRound = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'roundEnd',
      message: 'Round ended! Click "New Game" to play again.'
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-800 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">Quiero Truco</h1>
      
      <div className="bg-white rounded-lg p-3 mb-4 w-full max-w-4xl">
        <p className="text-center">{gameState.message}</p>
      </div>
      
      <div className="w-full max-w-4xl h-[60vh]">
        <GameBoard 
          topCards={gameState.topCards} 
          bottomCards={gameState.bottomCards} 
          middleCard={gameState.middleCard || { number: 0, palo: 'oro' }}
          onPlayerCardSelect={handlePlayerCardSelect}
        />
      </div>
      
      <div className="mt-6 flex gap-4">
        <button 
          onClick={initializeGame}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          New Game
        </button>
        <div className="text-white">
          <p>Cards in deck: {gameState.deck.length}</p>
          <p>Cards played: {gameState.playedCards.length}</p>
        </div>
      </div>
    </div>
  );
}
