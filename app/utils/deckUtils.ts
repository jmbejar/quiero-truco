import { CardProps, Palo } from '../components/Card';

// Define the full deck structure
export const createDeck = (): CardProps[] => {
  const palos: Palo[] = ['oro', 'copa', 'espada', 'basto'];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // Spanish deck numbers
  
  const deck: CardProps[] = [];
  
  // Create all combinations of numbers and palos
  for (const palo of palos) {
    for (const number of numbers) {
      deck.push({ number, palo });
    }
  }
  
  return deck;
};

// Shuffle the deck using Fisher-Yates algorithm
export const shuffleDeck = (deck: CardProps[]): CardProps[] => {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Deal cards from the deck
export const dealCards = (deck: CardProps[]): {
  topCards: CardProps[];
  bottomCards: CardProps[];
  middleCard: CardProps;
  remainingDeck: CardProps[];
} => {
  // Make a copy of the deck to avoid modifying the original
  const shuffledDeck = shuffleDeck([...deck]);
  
  // Deal cards
  const topCards = shuffledDeck.slice(0, 3);
  const bottomCards = shuffledDeck.slice(3, 6);
  const middleCard = shuffledDeck[6];
  const remainingDeck = shuffledDeck.slice(7);
  
  return {
    topCards,
    bottomCards,
    middleCard,
    remainingDeck
  };
};
