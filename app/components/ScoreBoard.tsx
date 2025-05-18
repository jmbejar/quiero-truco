import React from 'react';

interface ScoreBoardProps {
  humanScore: number;
  aiScore: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ humanScore, aiScore }) => (
  <div className="flex justify-center gap-8 mb-8">
    <div className="bg-green-100 rounded px-4 py-2 text-center w-24">
      <p className="font-bold text-green-800">Tú</p>
      <p className="text-2xl font-bold text-green-900">{humanScore}</p>
    </div>
    <div className="bg-gray-100 rounded px-4 py-2 text-center w-24">
      <p className="font-bold text-gray-800">CPU</p>
      <p className="text-2xl font-bold text-gray-900">{aiScore}</p>
    </div>
  </div>
);

export default ScoreBoard; 