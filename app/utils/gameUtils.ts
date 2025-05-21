import { CardProps } from '../components/Card';

// Card values in Truco (higher number means higher value)
const CARD_VALUES: { [key: number]: number } = {
  3: 13,  // Highest value
  2: 12,
  1: 11,  // Ancho
  12: 10,
  11: 9,
  10: 8,
  7: 7,   // Siete
  6: 6,
  5: 5,
  4: 4    // Lowest value
};

// Special cards that can be "envido" (same suit as muestra)
const ENVIDO_CARDS = [2, 4, 5, 10, 11];

// Envido values for special muestra-suit cards
const ENVIDO_SPECIAL_VALUES: { [key: number]: number } = {
  2: 30,
  4: 29,
  5: 28,
  10: 27,
  11: 27
};

// Special cards that are stronger than regular cards but weaker than envido
const SPECIAL_CARDS = [
  { number: 1, palo: 'espada' },  // 1 of swords (strongest special)
  { number: 1, palo: 'basto' },   // 1 of clubs
  { number: 7, palo: 'espada' },  // 7 of swords
  { number: 7, palo: 'oro' }      // 7 of coins
];

const isSpecialCard = (card: CardProps): boolean => {
  return SPECIAL_CARDS.some(special => 
    special.number === card.number && special.palo === card.palo
  );
};

const getSpecialCardRank = (card: CardProps): number => {
  return SPECIAL_CARDS.findIndex(special => 
    special.number === card.number && special.palo === card.palo
  );
};

// --- Enums for type safety ---
export enum Suit {
  Espada = 'espada',
  Basto = 'basto',
  Oro = 'oro',
  Copa = 'copa',
}

export enum CardNumber {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Ten = 10,
  Eleven = 11,
  Twelve = 12,
}

// --- Constants for magic numbers ---
const ENVIDO_BONUS = 20;
const ENVIDO_ZERO_NUMBERS = [12, 11, 10];

// Helper to check if a card is a special muestra card
const isSpecialMuestraCard = (card: CardProps, muestraSuit: string): boolean => {
  return card.palo === muestraSuit && ENVIDO_CARDS.includes(card.number);
};

/**
 * Calculates the envido points for given cards
 * @param cards The cards to calculate points for
 * @param muestraCard The muestra card for special envido rules
 * @returns The envido points (max 33, min 0). Handles special muestra-suit cards and all edge cases.
 */
export const calculateEnvidoPoints = (cards: CardProps[], muestraCard: CardProps): number => {
  if (cards.length !== 3) throw new Error('calculateEnvidoPoints requires exactly 3 cards');
  
  // Convert cards 12, 11, 10 to zero value for envido
  const getEnvidoValue = (card: CardProps): number => {
    if (ENVIDO_ZERO_NUMBERS.includes(card.number)) return 0;
    return card.number;
  };

  // Check for special muestra-suit cards
  const muestraSuit = muestraCard.palo;
  const specialMuestraCards = cards.filter(card => isSpecialMuestraCard(card, muestraSuit));
  
  // Handle special muestra-suit card case
  if (specialMuestraCards.length === 1) {
    const specialCard = specialMuestraCards[0];
    const specialValue = ENVIDO_SPECIAL_VALUES[specialCard.number];
    
    // Find highest value from remaining cards
    const remainingCards = cards.filter(card => 
      !(card.palo === specialCard.palo && card.number === specialCard.number)
    );
    
    const highestValue = remainingCards.length > 0
      ? Math.max(...remainingCards.map(getEnvidoValue))
      : 0;
    
    return specialValue + highestValue;
  }
  
  // Assume cards.length === 3
  const [a, b, c] = cards;

  if (a.palo === b.palo && b.palo === c.palo) {
    // All three cards have the same suit
    const sum = getEnvidoValue(a) + getEnvidoValue(b) + getEnvidoValue(c);
    return sum + ENVIDO_BONUS;
  }
  if (a.palo === b.palo) {
    // a and b share the same suit
    return getEnvidoValue(a) + getEnvidoValue(b) + ENVIDO_BONUS;
  }
  if (a.palo === c.palo) {
    // a and c share the same suit
    return getEnvidoValue(a) + getEnvidoValue(c) + ENVIDO_BONUS;
  }
  if (b.palo === c.palo) {
    // b and c share the same suit
    return getEnvidoValue(b) + getEnvidoValue(c) + ENVIDO_BONUS;
  }
  // All suits are different
  return Math.max(getEnvidoValue(a), getEnvidoValue(b), getEnvidoValue(c));
};

/**
 * Checks if the given cards constitute a "flor" according to Uruguayan truco rules
 * @param cards The cards to check
 * @param muestraCard The muestra card for special flor rules
 * @returns True if the cards constitute a flor (all same suit, or special muestra-suit card rules)
 */
export const hasFlor = (cards: CardProps[], muestraCard: CardProps): boolean => {
  if (cards.length === 0) return false;
  
  // Traditional flor: all cards have the same suit
  const firstSuit = cards[0].palo;
  const allSameSuit = cards.every(card => card.palo === firstSuit);
  if (allSameSuit) return true;
  
  // Count special cards with the same suit as muestra
  const muestraSuit = muestraCard.palo;
  const specialMuestraCards = cards.filter(card => isSpecialMuestraCard(card, muestraSuit));
  
  // Special case 1: Two or more special cards with muestra suit
  if (specialMuestraCards.length >= 2) return true;
  
  // Special case 2: One special card with muestra suit, and remaining cards have the same suit
  if (specialMuestraCards.length === 1) {
    const remainingCards = cards.filter(card => !isSpecialMuestraCard(card, muestraSuit));
    if (remainingCards.length > 0) {
      const remainingSuit = remainingCards[0].palo;
      return remainingCards.every(card => card.palo === remainingSuit);
    }
  }
  
  return false;
};

export const determineWinner = (playerCard: CardProps, aiCard: CardProps, muestraCard: CardProps): boolean => {
  // Check if either card is "envido" (same suit as muestra)
  // Special case: 12 card with same suit as muestra is treated as the muestra card if muestra is an envido card
  const playerIsEnvido = (playerCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(playerCard.number)) || 
                       (playerCard.number === 12 && playerCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(muestraCard.number));
  const aiIsEnvido = (aiCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(aiCard.number)) || 
                   (aiCard.number === 12 && aiCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(muestraCard.number));

  // If only one card is envido, that card wins
  if (playerIsEnvido && !aiIsEnvido) return true;
  if (!playerIsEnvido && aiIsEnvido) return false;

  // If both cards are envido, compare directly using the envido ranking (lower number means stronger card)
  if (playerIsEnvido && aiIsEnvido) {
    // Special case for 12 with same suit as muestra - use the muestra's number for comparison
    const playerNumber = (playerCard.number === 12 && playerCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(muestraCard.number)) 
      ? muestraCard.number 
      : playerCard.number;
      
    const aiNumber = (aiCard.number === 12 && aiCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(muestraCard.number)) 
      ? muestraCard.number 
      : aiCard.number;
      
    // For envido cards, lower number means stronger card
    return playerNumber < aiNumber;
  }

  // If neither is envido, check for special cards
  const playerIsSpecial = isSpecialCard(playerCard);
  const aiIsSpecial = isSpecialCard(aiCard);

  if (playerIsSpecial && aiIsSpecial) {
    // If both are special, compare their ranks (lower index means stronger card)
    return getSpecialCardRank(playerCard) < getSpecialCardRank(aiCard);
  }

  // If only one is special, that card wins
  if (playerIsSpecial) return true;
  if (aiIsSpecial) return false;

  // If neither is special nor envido, compare regular card values
  return CARD_VALUES[playerCard.number] > CARD_VALUES[aiCard.number];
}; 