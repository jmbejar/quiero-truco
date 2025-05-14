import React from "react";
import Image from "next/image";

export type Palo = "oro" | "basto" | "espada" | "copa";

export interface CardProps {
  number: number;
  palo: Palo;
  faceDown?: boolean;
}

const Card: React.FC<CardProps> = ({ number, palo, faceDown = false }) => {
  if (faceDown) {
    return (
      <div className="flex flex-col items-center justify-center w-24 h-36 bg-red-700 border-2 border-gray-300 rounded-lg shadow-md">
        {/* Card back design */}
        <div className="w-16 h-24 border-2 border-gray-400 rounded bg-red-800 flex items-center justify-center">
          <div className="text-white text-xs">Truco</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-24 h-36 relative">
      <Image
        src={`/naipes/${number} ${palo}.png`}
        alt={`${number} de ${palo}`}
        fill
        className="object-contain"
        sizes="96px"
      />
    </div>
  );
};

export default Card;
