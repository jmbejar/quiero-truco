'use client';

import React, { useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { useTrucoGame } from './hooks/useTrucoGame';

export default function Home() {
  const {
    gameState,
    initializeGame,
    handleNextTurn,
    handlePlayerCardSelect,
    handleTruco,
    handleTrucoResponse,
    nextTurnProgress
  } = useTrucoGame();

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-600">
      <h1 className="text-3xl font-bold text-white m-4">Quiero Truco</h1>
      <div className="flex flex-row w-full h-[90vh] bg-green-800 overflow-hidden">
        <div className="w-3/4 h-full flex items-center justify-center bg-transparent p-4">
          <GameBoard 
            topCards={gameState.aiCards} 
            bottomCards={gameState.humanCards} 
            middleCard={gameState.muestraCard}
            playerPlayedCard={gameState.humanPlayedCard}
            aiPlayedCard={gameState.aiPlayedCard}
            onPlayerCardSelect={handlePlayerCardSelect}
          />
        </div>
        <div className="w-1/4 h-full flex flex-col justify-between bg-gray-50 p-6 border-l border-gray-200">
          <div>
            <div className="text-lg font-semibold text-gray-800 mb-4 text-center min-h-[48px]">{gameState.message}</div>
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="flex gap-2">
                  {[0, 1, 2].map((index) => {
                    const result = gameState.roundState.resultHistory[index];
                    return (
                      <span key={index} className="flex items-center gap-1">
                        <span className={result === 'win' ? 'text-green-600' : result === 'lose' ? 'text-red-600' : 'text-gray-400'}>
                          {result === 'win' ? '✅' : result === 'lose' ? '❌' : '➖'}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            <div className="flex justify-center gap-8 mb-8">
              <div className="bg-green-100 rounded px-4 py-2 text-center w-24">
                <p className="font-bold text-green-800">You</p>
                <p className="text-2xl font-bold text-green-900">{gameState.humanScore}</p>
              </div>
              <div className="bg-gray-100 rounded px-4 py-2 text-center w-24">
                <p className="font-bold text-gray-800">AI</p>
                <p className="text-2xl font-bold text-gray-900">{gameState.aiScore}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 items-center">
            {gameState.phase.type === 'ROUND_END' && (
              <button 
                onClick={initializeGame}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Next Round
              </button>
            )}
            {gameState.phase.type === 'SHOWING_PLAYED_CARDS' && (
              <button 
                onClick={handleNextTurn}
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
            {gameState.phase.type === 'HUMAN_TURN' && (
              <div className="flex gap-4 w-full justify-center">
                {gameState.trucoState.type === 'NONE' && gameState.trucoState.lastCaller !== 'HUMAN' && (
                  <button
                    onClick={handleTruco}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                  >
                    Truco
                  </button>
                )}
                {gameState.trucoState.type === 'ACCEPTED' && gameState.trucoState.level === 'TRUCO' && gameState.trucoState.lastCaller !== 'HUMAN' && (
                  <button
                    onClick={handleTruco}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                  >
                    Retruco
                  </button>
                )}
                {gameState.trucoState.type === 'ACCEPTED' && gameState.trucoState.level === 'RETRUCO' && gameState.trucoState.lastCaller !== 'HUMAN' && (
                  <button
                    onClick={handleTruco}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                  >
                    Vale 4
                  </button>
                )}
              </div>
            )}
            {/* Truco response buttons */}
            {gameState.trucoState.type === 'CALLED' && gameState.trucoState.lastCaller === 'AI' && (
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => handleTrucoResponse(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full w-full"
                >
                  Quiero
                </button>
                <button
                  onClick={() => handleTrucoResponse(false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full w-full"
                >
                  No Quiero
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
