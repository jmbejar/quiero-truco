import { createDeck, dealCards } from '../deckUtils';

describe('createDeck', () => {
  it('creates a deck with 40 unique cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(40);
    const unique = new Set(deck.map(card => `${card.number}-${card.palo}`));
    expect(unique.size).toBe(40);
  });
});

describe('dealCards', () => {
  it('deals 3 cards to each player, 1 middle card, and the rest as remaining', () => {
    const deck = createDeck();
    const { topCards, bottomCards, middleCard, remainingDeck } = dealCards(deck);
    expect(topCards).toHaveLength(3);
    expect(bottomCards).toHaveLength(3);
    expect(middleCard).toBeDefined();
    expect(remainingDeck).toHaveLength(33);
    // All cards should be unique
    const all = [...topCards, ...bottomCards, middleCard, ...remainingDeck];
    const unique = new Set(all.map(card => `${card.number}-${card.palo}`));
    expect(unique.size).toBe(40);
  });
}); 