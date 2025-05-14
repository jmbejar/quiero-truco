import React from 'react';
import { GameState } from '../types/game';

interface ActionButtonsProps {
  phase: GameState['phase'];
  trucoState: GameState['trucoState'];
  nextTurnProgress: number;
  onNextRound: () => void;
  onNextTurn: () => void;
  onTruco: () => void;
  onTrucoResponse: (accept: boolean) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  phase,
  trucoState,
  nextTurnProgress,
  onNextRound,
  onNextTurn,
  onTruco,
  onTrucoResponse
}) => (
  <div className="flex flex-col gap-4 items-center">
    {phase.type === 'ROUND_END' && (
      <button 
        onClick={onNextRound}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
      >
        Next Round
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
        className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
      >
        Next Turn
      </button>
    )}
    {/* Truco action buttons */}
    {phase.type === 'HUMAN_TURN' && (
      <div className="flex gap-4 w-full justify-center">
        {trucoState.type === 'NONE' && trucoState.lastCaller !== 'HUMAN' && (
          <button
            onClick={onTruco}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
          >
            Truco
          </button>
        )}
        {trucoState.type === 'ACCEPTED' && trucoState.level === 'TRUCO' && trucoState.lastCaller !== 'HUMAN' && (
          <button
            onClick={onTruco}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
          >
            Retruco
          </button>
        )}
        {trucoState.type === 'ACCEPTED' && trucoState.level === 'RETRUCO' && trucoState.lastCaller !== 'HUMAN' && (
          <button
            onClick={onTruco}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
          >
            Vale 4
          </button>
        )}
      </div>
    )}
    {/* Truco response buttons */}
    {trucoState.type === 'CALLED' && trucoState.lastCaller === 'AI' && (
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={() => onTrucoResponse(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full w-full"
        >
          Quiero
        </button>
        <button
          onClick={() => onTrucoResponse(false)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
        >
          No Quiero
        </button>
      </div>
    )}
  </div>
);

export default ActionButtons; 