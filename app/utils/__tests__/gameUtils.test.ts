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

  it('returns false if both are envido and player card has lower ranking', () => {
    const playerCard = { number: 4, palo: 'espada' as Palo };
    const aiCard = { number: 2, palo: 'espada' as Palo };
    expect(determineWinner(playerCard, aiCard, muestra)).toBe(false);
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

  it('treats 12 with same suit as muestra as envido when muestra is an envido card', () => {
    // Muestra is 5 of oro (envido card)
    const envMuestra = { number: 5, palo: 'oro' as Palo };
    // Player has 12 of oro (same suit as muestra)
    const playerCard = { number: 12, palo: 'oro' as Palo };
    // AI has a strong card but not envido
    const aiCard = { number: 3, palo: 'basto' as Palo };
    expect(determineWinner(playerCard, aiCard, envMuestra)).toBe(true);
  });

  it('12 with same suit as muestra loses against higher ranking envido cards', () => {
    // Muestra is 5 of oro (envido card)
    const envMuestra = { number: 5, palo: 'oro' as Palo };
    // Player has 12 of oro (same suit as muestra, treated as 5 of oro)
    const playerCard = { number: 12, palo: 'oro' as Palo };
    // AI has 4 of oro (envido card, should beat 5)
    const aiCard = { number: 4, palo: 'oro' as Palo };
    expect(determineWinner(playerCard, aiCard, envMuestra)).toBe(false);
  });

  it('does not treat 12 with same suit as muestra as envido when muestra is not an envido card', () => {
    // Muestra is 6 of oro (not an envido card)
    const nonEnvMuestra = { number: 6, palo: 'oro' as Palo };
    // Player has 12 of oro (same suit as muestra, but no special treatment)
    const playerCard = { number: 12, palo: 'oro' as Palo };
    // AI has 7 of copa (regular card with lower value than 12)
    const aiCard = { number: 7, palo: 'copa' as Palo };
    expect(determineWinner(playerCard, aiCard, nonEnvMuestra)).toBe(true);
  });

  it('matches the example in the issue description (12 de oro with 5 de oro as muestra)', () => {
    // Muestra is 5 of oro (envido card)
    const muestraCard = { number: 5, palo: 'oro' as Palo };
    // Player has 12 of oro (same suit as muestra, treated as 5 of oro)
    const playerCard = { number: 12, palo: 'oro' as Palo };
    
    // 12 de oro should win against regular cards
    const regularCard = { number: 3, palo: 'basto' as Palo };
    expect(determineWinner(playerCard, regularCard, muestraCard)).toBe(true);
    
    // 12 de oro should lose against 4 de oro (as mentioned in the example)
    const fourOro = { number: 4, palo: 'oro' as Palo };
    expect(determineWinner(playerCard, fourOro, muestraCard)).toBe(false);
    
    // 12 de oro should lose against 2 de oro (as mentioned in the example)
    const twoOro = { number: 2, palo: 'oro' as Palo };
    expect(determineWinner(playerCard, twoOro, muestraCard)).toBe(false);
  });
});

describe('hasFlor', () => {
  it('returns true when all cards have the same suit', () => {
    const cards = [
      { number: 1, palo: 'espada' as Palo },
      { number: 5, palo: 'espada' as Palo },
      { number: 12, palo: 'espada' as Palo }
    ];
    expect(hasFlor(cards)).toBe(true);
  });

  it('returns false when cards have different suits', () => {
    const cards = [
      { number: 1, palo: 'espada' as Palo },
      { number: 5, palo: 'basto' as Palo },
      { number: 12, palo: 'espada' as Palo }
    ];
    expect(hasFlor(cards)).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(hasFlor([])).toBe(false);
  });
}); 