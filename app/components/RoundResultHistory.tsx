import React from 'react';

interface RoundResultHistoryProps {
  resultHistory: ("win" | "lose" | undefined)[];
}

const RoundResultHistory: React.FC<RoundResultHistoryProps> = ({ resultHistory }) => (
  <div className="flex flex-col items-center gap-2 mb-6">
    <div className="flex gap-2">
      {[0, 1, 2].map((index) => {
        const result = resultHistory[index];
        return (
          <span key={index} className="flex items-center gap-1">
            <span className={
              result === 'win' ? 'text-green-600' :
              result === 'lose' ? 'text-red-600' :
              'text-gray-400'
            }>
              {result === 'win' ? '✅' : result === 'lose' ? '❌' : '➖'}
            </span>
          </span>
        );
      })}
    </div>
  </div>
);

export default RoundResultHistory; 