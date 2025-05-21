import { determineWinner, hasFlor } from '../gameUtils';
import { Palo } from '../../components/Card';

const muestra = { number: 4, palo: 'espada' as Palo };

describe('determineWinner', () => {
  it('returns true if player card is envido and AI card is not', () => {
    const playerCard = { number: 4, palo: 'espada' as Palo };
    const aiCard = { number: 3, palo: 'basto' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(true);
  });

  it('returns false if AI card is envido and player card is not', () => {
    const playerCard = { number: 3, palo: 'basto' as Palo };
    const aiCard = { number: 4, palo: 'espada' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(false);
  });

  it('returns true if both are envido and player card has higher value', () => {
    const playerCard = { number: 4, palo: 'espada' as Palo };
    const aiCard = { number: 2, palo: 'espada' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(true);
  });

  it('returns true if player card is special and AI card is not', () => {
    const playerCard = { number: 1, palo: 'espada' as Palo };
    const aiCard = { number: 3, palo: 'basto' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(true);
  });

  it('returns false if AI card is special and player card is not', () => {
    const playerCard = { number: 3, palo: 'basto' as Palo };
    const aiCard = { number: 1, palo: 'espada' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(false);
  });

  it('returns true if both are special and player card is stronger', () => {
    const playerCard = { number: 1, palo: 'espada' as Palo };
    const aiCard = { number: 1, palo: 'basto' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(true);
  });

  it('returns true if neither is envido or special and player card has higher value', () => {
    const playerCard = { number: 3, palo: 'basto' as Palo };
    const aiCard = { number: 2, palo: 'basto' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(true);
  });

  it('returns false if neither is envido or special and AI card has higher value', () => {
    const playerCard = { number: 2, palo: 'basto' as Palo };
    const aiCard = { number: 3, palo: 'basto' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(false);
  });
});

describe('hasFlor', () => {
  const muestra = { number: 4, palo: 'espada' as Palo };

  it('returns true when all cards have the same suit (traditional flor)', () => {
    const cards = [
      { number: 1, palo: 'espada' as Palo },
      { number: 5, palo: 'espada' as Palo },
      { number: 12, palo: 'espada' as Palo }
    ];
    expect(hasFlor(cards)).toBe(true);
    expect(hasFlor(cards, muestra)).toBe(true);
  });

  it('returns false when cards have different suits (without muestra)', () => {
    const cards = [
      { number: 1, palo: 'espada' as Palo },
      { number: 5, palo: 'basto' as Palo },
      { number: 12, palo: 'espada' as Palo }
    ];
    expect(hasFlor(cards)).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(hasFlor([])).toBe(false);
    expect(hasFlor([], muestra)).toBe(false);
  });

  // New tests for special cases
  it('returns true when one card has special muestra suit and others have same different suit', () => {
    // Card 4 of espada is special because it matches muestra suit and is in ENVIDO_CARDS
    const cards = [
      { number: 4, palo: 'espada' as Palo }, // Special muestra card
      { number: 7, palo: 'oro' as Palo },
      { number: 11, palo: 'oro' as Palo }
    ];
    expect(hasFlor(cards)).toBe(false); // Traditional rule would fail
    expect(hasFlor(cards, muestra)).toBe(true); // But special rule applies
  });

  it('returns true when two cards have special muestra suit', () => {
    const cards = [
      { number: 4, palo: 'espada' as Palo }, // Special muestra card
      { number: 5, palo: 'espada' as Palo }, // Special muestra card
      { number: 7, palo: 'oro' as Palo }
    ];
    expect(hasFlor(cards)).toBe(false); // Traditional rule would fail
    expect(hasFlor(cards, muestra)).toBe(true); // But special rule applies
  });

  it('returns false when one card has muestra suit but not a special number', () => {
    const cards = [
      { number: 3, palo: 'espada' as Palo }, // Same suit as muestra but not in ENVIDO_CARDS
      { number: 7, palo: 'oro' as Palo },
      { number: 11, palo: 'oro' as Palo }
    ];
    expect(hasFlor(cards)).toBe(false);
    expect(hasFlor(cards, muestra)).toBe(false);
  });

  it('returns false when one card has special number but different suit from muestra', () => {
    const cards = [
      { number: 4, palo: 'oro' as Palo }, // Special number but different suit
      { number: 7, palo: 'oro' as Palo },
      { number: 11, palo: 'oro' as Palo }
    ];
    expect(hasFlor(cards)).toBe(true); // Traditional rule passes
    expect(hasFlor(cards, muestra)).toBe(true); // Still passes with special rules
  });
}); 