import React from 'react';
import Card, { CardProps } from './Card';
import { GamePhase, TrucoState } from '../types/game';

interface GameBoardProps {
  topCards: CardProps[];
  bottomCards: CardProps[];
  middleCard: CardProps;
  playerPlayedCard?: CardProps | null;
  aiPlayedCard?: CardProps | null;
  onPlayerCardSelect?: (index: number) => void;
  onTruco?: () => void;
  onTrucoResponse?: (accept: boolean) => void;
  trucoState: TrucoState;
  gamePhase: GamePhase;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  topCards, 
  bottomCards, 
  middleCard,
  playerPlayedCard,
  aiPlayedCard,
  onPlayerCardSelect,
  onTruco,
  onTrucoResponse,
  trucoState,
  gamePhase
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
            >
              <Card number={card.number} palo={card.palo} />
            </div>
          ))}
        </div>
        
        {/* Truco buttons */}
        {gamePhase.type === 'HUMAN_TURN' && (
          <div className="mt-4 flex gap-4">
            {trucoState.type === 'NONE' && trucoState.lastCaller !== 'human' && (
              <button
                onClick={onTruco}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transform hover:scale-105 transition-transform"
              >
                Truco
              </button>
            )}
            {trucoState.type === 'ACCEPTED' && trucoState.points === 2 && trucoState.lastCaller !== 'human' && (
              <button
                onClick={onTruco}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transform hover:scale-105 transition-transform"
              >
                Retruco
              </button>
            )}
            {trucoState.type === 'ACCEPTED' && trucoState.points === 3 && trucoState.lastCaller !== 'human' && (
              <button
                onClick={onTruco}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transform hover:scale-105 transition-transform"
              >
                Vale 4
              </button>
            )}
          </div>
        )}

        {/* Truco response buttons */}
        {(trucoState.type === 'AI_TRUCO_CALLED' || 
          trucoState.type === 'AI_RETRUCO_CALLED' || 
          trucoState.type === 'AI_VALE4_CALLED') && onTrucoResponse && (
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => onTrucoResponse(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transform hover:scale-105 transition-transform"
            >
              Quiero
            </button>
            <button
              onClick={() => onTrucoResponse(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transform hover:scale-105 transition-transform"
            >
              No Quiero
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
