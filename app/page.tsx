'use client';

import React, { useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { useTrucoGame } from './hooks/useTrucoGame';
import ScoreBoard from './components/ScoreBoard';
import RoundResultHistory from './components/RoundResultHistory';
import MessageBanner from './components/MessageBanner';
import ActionButtons from './components/ActionButtons';

export default function Home() {
  const {
    gameState,
    initializeGame,
    handleNextTurn,
    handlePlayerCardSelect,
    handleTruco,
    handleEnvido,
    handleTrucoResponse,
    handleEnvidoResponse,
    nextTurnProgress
  } = useTrucoGame();

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-600">
      <h1 className="text-3xl font-bold text-white m-4">Quiero Truco</h1>
      <div className="flex flex-row w-full h-[90vh] bg-green-800 overflow-hidden">
        <div className="w-2/3 h-full flex items-center justify-center bg-transparent p-4">
          <GameBoard 
            topCards={gameState.aiCards} 
            bottomCards={gameState.humanCards} 
            middleCard={gameState.muestraCard}
            playerPlayedCard={gameState.humanPlayedCard}
            aiPlayedCard={gameState.aiPlayedCard}
            onPlayerCardSelect={handlePlayerCardSelect}
          />
        </div>
        <div className="w-1/3 h-full flex flex-col justify-between bg-gray-50 p-6 border-l border-gray-200">
          <div>
            <MessageBanner message={gameState.message} />
            <RoundResultHistory resultHistory={gameState.roundState.resultHistory} />
            <ScoreBoard humanScore={gameState.humanScore} aiScore={gameState.aiScore} />
          </div>
          <ActionButtons
            phase={gameState.phase}
            trucoState={gameState.trucoState}
            envidoState={gameState.envidoState}
            playedCards={gameState.playedCards}
            nextTurnProgress={nextTurnProgress}
            onNextRound={initializeGame}
            onNextTurn={handleNextTurn}
            onTruco={handleTruco}
            onEnvido={handleEnvido}
            onTrucoResponse={handleTrucoResponse}
            onEnvidoResponse={handleEnvidoResponse}
          />
        </div>
      </div>
    </div>
  );
}
