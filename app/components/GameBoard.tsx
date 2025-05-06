import React from 'react';
import Card, { CardProps } from './Card';

interface GameBoardProps {
  topCards: CardProps[];
  bottomCards: CardProps[];
  middleCard: CardProps;
  onPlayerCardSelect?: (index: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  topCards, 
  bottomCards, 
  middleCard,
  onPlayerCardSelect 
}) => {
  return (
    <div className="flex flex-col items-center justify-between h-full w-full">
      {/* Top row of cards (opponent) - face down */}
      <div className="flex justify-center gap-4 w-full">
        {topCards.map((card, index) => (
          <Card key={`top-${index}`} number={card.number} palo={card.palo} faceDown={true} />
        ))}
      </div>

      {/* Middle card */}
      <div className="flex justify-center my-8">
        {middleCard.number > 0 && (
          <Card number={middleCard.number} palo={middleCard.palo} />
        )}
        {middleCard.number === 0 && (
          <div className="w-24 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">Play a card</span>
          </div>
        )}
      </div>

      {/* Bottom row of cards (player) - clickable */}
      <div className="flex justify-center gap-4 w-full">
        {bottomCards.map((card, index) => (
          <div 
            key={`bottom-${index}`}
            onClick={() => onPlayerCardSelect && onPlayerCardSelect(index)}
            className={onPlayerCardSelect ? "cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-transform" : ""}
          >
            <Card number={card.number} palo={card.palo} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
