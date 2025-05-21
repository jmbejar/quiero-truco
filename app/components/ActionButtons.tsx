import React from 'react';
import { GameState } from '../types/game';
import { hasFlor } from '../utils/gameUtils';

interface ActionButtonsProps {
  phase: GameState['phase'];
  trucoState: GameState['trucoState'];
  envidoState: GameState['envidoState'];
  playedCards: GameState['playedCards'];
  humanPlayedCard: GameState['humanPlayedCard'];
  nextTurnProgress: number;
  humanCards: GameState['humanCards'];
  aiCards: GameState['aiCards'];
  muestraCard: GameState['muestraCard'];
  onNextRound: () => void;
  onNextTurn: () => void;
  onTruco: () => void;
  onEnvido: () => void;
  onTrucoResponse: (action: 'accept' | 'reject' | 'escalate') => void;
  onEnvidoResponse: (action: 'accept' | 'reject') => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  phase,
  trucoState,
  envidoState,
  playedCards,
  humanPlayedCard,
  nextTurnProgress,
  humanCards,
  aiCards,
  muestraCard,
  onNextRound,
  onNextTurn,
  onTruco,
  onEnvido,
  onTrucoResponse,
  onEnvidoResponse
}) => {
  // Helper function to determine if Envido button should be shown
  const canShowEnvidoButton = () => {
    const isHumanTurn = phase.type === 'HUMAN_TURN';
    const isEarlyInRound = playedCards.length === 0 || (playedCards.length === 1 && humanPlayedCard === null);
    const noEnvidoCalled = envidoState.type === 'NONE';
    const noTrucoCalled = trucoState.type === 'NONE';
    const noFlor = !hasFlor(humanCards, muestraCard) && !hasFlor(aiCards, muestraCard);
    
    return isHumanTurn && isEarlyInRound && noEnvidoCalled && noTrucoCalled && noFlor;
  };

  return (
  <div className="flex flex-col gap-4 items-center">
    {phase.type === 'ROUND_END' && (
      <button 
        onClick={onNextRound}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full cursor-pointer"
      >
        Siguiente Ronda
      </button>
    )}
    {phase.type === 'SHOWING_PLAYED_CARDS' && (
      <button 
        onClick={onNextTurn}
        style={{
          background: `linear-gradient(
            to right,
            rgb(191,219,254) 0%,
            rgb(191,219,254) ${Math.round(nextTurnProgress * 100)}%,
            rgb(59,130,246) ${Math.round(nextTurnProgress * 100)}%,
            rgb(59,130,246) 100%
          )`,
          transition: 'background 0.2s linear'
        }}
        className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full cursor-pointer"
      >
        Siguiente Turno
      </button>
    )}
    {/* Envido action button */}
    {canShowEnvidoButton() && (
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={onEnvido}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
        >
          Envido
        </button>
      </div>
    )}
    {/* Envido response buttons */}
    {envidoState.type === 'CALLED' && envidoState.lastCaller === 'AI' && (
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={() => onEnvidoResponse('accept')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
        >
          Quiero
        </button>
        <button
          onClick={() => onEnvidoResponse('reject')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
        >
          No Quiero
        </button>
      </div>
    )}
    {/* Truco action buttons */}
    {phase.type === 'HUMAN_TURN' && envidoState.type !== 'CALLED' && (
      <div className="flex gap-4 w-full justify-center">
        {trucoState.type === 'NONE' && trucoState.lastCaller !== 'HUMAN' && (
          <button
            onClick={onTruco}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
          >
            Truco
          </button>
        )}
        {trucoState.type === 'ACCEPTED' && trucoState.level === 'TRUCO' && trucoState.lastCaller !== 'HUMAN' && (
          <button
            onClick={onTruco}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
          >
            Retruco
          </button>
        )}
        {trucoState.type === 'ACCEPTED' && trucoState.level === 'RETRUCO' && trucoState.lastCaller !== 'HUMAN' && (
          <button
            onClick={onTruco}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
          >
            Vale 4
          </button>
        )}
      </div>
    )}
    {/* Truco response buttons */}
    {trucoState.type === 'CALLED' && trucoState.lastCaller === 'AI' && envidoState.type !== 'CALLED' && (
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={() => onTrucoResponse('accept')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
        >
          Quiero
        </button>
        <button
          onClick={() => onTrucoResponse('reject')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
        >
          No Quiero
        </button>
        {(trucoState.level === 'TRUCO' || trucoState.level === 'RETRUCO') && (
          <button
            onClick={() => onTrucoResponse('escalate')}
            className={
              trucoState.level === 'TRUCO'
                ? "bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
                : "bg-yellow-800 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded-full w-full cursor-pointer"
            }
          >
            {trucoState.level === 'TRUCO' ? 'Retruco' : 'Vale 4'}
          </button>
        )}
      </div>
    )}
  </div>
  );
};

export default ActionButtons; 