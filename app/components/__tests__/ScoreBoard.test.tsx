import React from 'react';
import { render, screen } from '@testing-library/react';
import ScoreBoard from '../ScoreBoard';

describe('ScoreBoard', () => {
  it('renders human and AI scores correctly', () => {
    render(<ScoreBoard humanScore={5} aiScore={3} />);
    expect(screen.getByText('Tú')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
}); 