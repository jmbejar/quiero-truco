import React from 'react';
import Card, { CardProps } from './Card';

interface GameBoardProps {
  topCards: CardProps[];
  bottomCards: CardProps[];
  middleCard: CardProps;
  playerPlayedCard?: CardProps | null;
  aiPlayedCard?: CardProps | null;
  onPlayerCardSelect?: (index: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  topCards, 
  bottomCards, 
  middleCard,
  playerPlayedCard,
  aiPlayedCard,
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

      {/* Middle area with muestra and played cards */}
      <div className="flex justify-center items-center my-8 w-full">
        {/* AI played card */}
        <div className="flex-1 flex justify-end mr-32">
          {aiPlayedCard ? (
            <Card number={aiPlayedCard.number} palo={aiPlayedCard.palo} />
          ) : (
            <div className="w-24 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center opacity-50">
              <span className="text-gray-400">AI card</span>
            </div>
          )}
        </div>

        {/* Muestra card (in the center) */}
        <div className="mx-4 transform rotate-90">
          {middleCard.number > 0 && (
            <div className="relative">
              <Card number={middleCard.number} palo={middleCard.palo} />
              <div className="absolute -bottom-6 left-0 right-0 text-center text-white text-xs bg-black bg-opacity-50 py-1 rounded">
                Muestra
              </div>
            </div>
          )}
        </div>

        {/* Player played card */}
        <div className="flex-1 flex justify-start ml-32">
          {playerPlayedCard ? (
            <Card number={playerPlayedCard.number} palo={playerPlayedCard.palo} />
          ) : (
            <div className="w-24 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center opacity-50">
              <span className="text-gray-400">Your card</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row of cards (player) - clickable */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex justify-center gap-4 w-full">
          {bottomCards.map((card, index) => (
            <div
              key={`bottom-${index}`}
              onClick={() => onPlayerCardSelect && onPlayerCardSelect(index)}
              className={onPlayerCardSelect ? "cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-transform" : ""}
              role={onPlayerCardSelect ? "button" : undefined}
              tabIndex={onPlayerCardSelect ? 0 : undefined}
            >
              <Card number={card.number} palo={card.palo} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
