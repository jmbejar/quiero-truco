import React from 'react';
import Card, { CardProps } from './Card';

interface GameBoardProps {
  topCards: CardProps[];
  bottomCards: CardProps[];
  middleCard: CardProps;
}

const GameBoard: React.FC<GameBoardProps> = ({ topCards, bottomCards, middleCard }) => {
  return (
    <div className="flex flex-col items-center justify-between h-full w-full">
      {/* Top row of cards (opponent) */}
      <div className="flex justify-center gap-4 w-full">
        {topCards.map((card, index) => (
          <Card key={`top-${index}`} number={card.number} palo={card.palo} />
        ))}
      </div>

      {/* Middle card */}
      <div className="flex justify-center my-8">
        <Card number={middleCard.number} palo={middleCard.palo} />
      </div>

      {/* Bottom row of cards (player) */}
      <div className="flex justify-center gap-4 w-full">
        {bottomCards.map((card, index) => (
          <Card key={`bottom-${index}`} number={card.number} palo={card.palo} />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
