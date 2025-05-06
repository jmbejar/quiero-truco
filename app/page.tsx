'use client';

import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { CardProps } from './components/Card';
import { createDeck, dealCards } from './utils/deckUtils';

export default function Home() {
  const [gameState, setGameState] = useState<{
    topCards: CardProps[];
    bottomCards: CardProps[];
    middleCard: CardProps;
    deck: CardProps[];
  }>({
    topCards: [],
    bottomCards: [],
    middleCard: { number: 0, palo: 'oro' },
    deck: []
  });

  // Initialize the game when the component mounts
  useEffect(() => {
    const fullDeck = createDeck();
    const { topCards, bottomCards, middleCard, remainingDeck } = dealCards(fullDeck);
    
    setGameState({
      topCards,
      bottomCards,
      middleCard,
      deck: remainingDeck
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-800 p-4">
      <h1 className="text-3xl font-bold text-white mb-8">Quiero Truco</h1>
      <div className="w-full max-w-4xl h-[70vh]">
        <GameBoard 
          topCards={gameState.topCards} 
          bottomCards={gameState.bottomCards} 
          middleCard={gameState.middleCard} 
        />
      </div>
      <div className="mt-4 text-white">
        <p>Remaining cards in deck: {gameState.deck.length}</p>
      </div>
    </div>
  );
}
