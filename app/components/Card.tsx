import React from 'react';

export type Palo = 'oro' | 'basto' | 'espada' | 'copa';

export interface CardProps {
  number: number;
  palo: Palo;
}

const Card: React.FC<CardProps> = ({ number, palo }) => {
  return (
    <div className="flex flex-col items-center justify-center w-24 h-36 bg-white border-2 border-gray-300 rounded-lg shadow-md">
      <div className="text-2xl font-bold">{number}</div>
      <div className="text-sm mt-2">{palo}</div>
    </div>
  );
};

export default Card;
