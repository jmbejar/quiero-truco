'use client';

import React from 'react';
import GameBoard from './components/GameBoard';
import { CardProps } from './components/Card';

export default function Home() {
  // Sample data for cards
  const topCards: CardProps[] = [
    { number: 1, palo: 'espada' },
    { number: 7, palo: 'oro' },
    { number: 3, palo: 'copa' },
  ];

  const bottomCards: CardProps[] = [
    { number: 5, palo: 'basto' },
    { number: 12, palo: 'espada' },
    { number: 6, palo: 'oro' },
  ];

  const middleCard: CardProps = { number: 4, palo: 'copa' };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-800 p-4">
      <h1 className="text-3xl font-bold text-white mb-8">Quiero Truco</h1>
      <div className="w-full max-w-4xl h-[70vh]">
        <GameBoard 
          topCards={topCards} 
          bottomCards={bottomCards} 
          middleCard={middleCard} 
        />
      </div>
    </div>
  );
}
