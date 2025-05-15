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
      <div
        className="flex flex-col items-center justify-center w-24 h-36 bg-red-700 border-2 border-gray-300 rounded-lg shadow-md p-0"
        data-testid="card-back"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 96 144"
          className="rounded"
          style={{ display: 'block' }}
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="cardBackPattern" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
              <rect x="0" y="0" width="12" height="12" fill="#991b1b" />
              <line x1="0" y1="0" x2="0" y2="12" stroke="#a94442" strokeWidth="2" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="96" height="144" rx="12" fill="url(#cardBackPattern)" stroke="#a3a3a3" strokeWidth="3" />
          <g>
            <rect x="12" y="12" width="72" height="120" rx="8" fill="none" stroke="#fff" strokeDasharray="6 3" strokeWidth="2" />
          </g>
        </svg>
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
