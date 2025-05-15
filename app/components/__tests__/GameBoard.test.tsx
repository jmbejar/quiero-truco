import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameBoard from '../GameBoard';
import type { CardProps } from '../Card';

describe('GameBoard', () => {
  const topCards: CardProps[] = [
    { number: 1, palo: 'espada' },
    { number: 2, palo: 'basto' },
    { number: 3, palo: 'oro' },
  ];
  const bottomCards: CardProps[] = [
    { number: 4, palo: 'copa' },
    { number: 5, palo: 'espada' },
    { number: 6, palo: 'basto' },
  ];
  const middleCard: CardProps = { number: 7, palo: 'oro' };

  it('renders the correct number of top and bottom cards', () => {
    render(
      <GameBoard
        topCards={topCards}
        bottomCards={bottomCards}
        middleCard={middleCard}
      />
    );
    
    // Top cards are flipped down
    const faceDownCards = screen.getAllByTestId('card-back');
    expect(faceDownCards.length).toBe(3);

    // and should not be visible
    expect(screen.queryByAltText('1 de espada')).not.toBeInTheDocument();
    expect(screen.queryByAltText('2 de basto')).not.toBeInTheDocument();
    expect(screen.queryByAltText('3 de oro')).not.toBeInTheDocument();

    // Bottom cards and muestra are visible
    expect(screen.getByAltText('4 de copa')).toBeInTheDocument();
    expect(screen.getByAltText('5 de espada')).toBeInTheDocument();
    expect(screen.getByAltText('6 de basto')).toBeInTheDocument();
    expect(screen.getByAltText('7 de oro')).toBeInTheDocument();
  });

  it('shows placeholders for AI and player cards when not present', () => {
    render(
      <GameBoard
        topCards={topCards}
        bottomCards={bottomCards}
        middleCard={middleCard}
      />
    );
    expect(screen.getByText('AI card')).toBeInTheDocument();
    expect(screen.getByText('Your card')).toBeInTheDocument();
  });

  it('renders AI and player played cards if provided', () => {
    render(
      <GameBoard
        topCards={topCards}
        bottomCards={bottomCards}
        middleCard={middleCard}
        aiPlayedCard={{ number: 12, palo: 'espada' }}
        playerPlayedCard={{ number: 5, palo: 'basto' }}
      />
    );
    // The placeholders should not be present
    expect(screen.queryByText('AI card')).not.toBeInTheDocument();
    expect(screen.queryByText('Your card')).not.toBeInTheDocument();
  });

  it('calls onPlayerCardSelect when a bottom card is clicked', () => {
    const onPlayerCardSelect = jest.fn();
    render(
      <GameBoard
        topCards={topCards}
        bottomCards={bottomCards}
        middleCard={middleCard}
        onPlayerCardSelect={onPlayerCardSelect}
      />
    );
    // Find all clickable bottom cards (by role or by class)
    const clickableDivs = screen.getAllByRole('button', { hidden: true });
    if (clickableDivs.length > 0) {
      fireEvent.click(clickableDivs[0]);
      expect(onPlayerCardSelect).toHaveBeenCalledWith(0);
    }
  });
});