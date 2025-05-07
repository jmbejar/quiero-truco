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

export const determineWinner = (playerCard: CardProps, aiCard: CardProps, muestraCard: CardProps): boolean => {
  // Check if either card is "envido" (same suit as muestra)
  const playerIsEnvido = playerCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(playerCard.number);
  const aiIsEnvido = aiCard.palo === muestraCard.palo && ENVIDO_CARDS.includes(aiCard.number);

  // If only one card is envido, that card wins
  if (playerIsEnvido && !aiIsEnvido) return true;
  if (!playerIsEnvido && aiIsEnvido) return false;

  // If both cards are envido, higher number wins
  if (playerIsEnvido && aiIsEnvido) {
    return CARD_VALUES[playerCard.number] < CARD_VALUES[aiCard.number];
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