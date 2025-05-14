import { determineWinner } from '../gameUtils';
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