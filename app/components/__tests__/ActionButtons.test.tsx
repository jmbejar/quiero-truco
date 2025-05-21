import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionButtons from '../ActionButtons';

describe('ActionButtons', () => {
  it('renders Next Round button on ROUND_END and calls handler on click', () => {
    const onNextRound = jest.fn();
    render(
      <ActionButtons
        phase={{ type: 'ROUND_END' }}
        trucoState={{ type: 'NONE', level: null, lastCaller: null }}
        envidoState={{ type: 'NONE', lastCaller: null, humanPoints: 0, aiPoints: 0 }}
        playedCards={[]}
        humanPlayedCard={null}
        nextTurnProgress={0}
        humanCards={[]}
        aiCards={[]}
        originalHumanCards={[]}
        originalAiCards={[]}
        muestraCard={{ number: 1, palo: 'oro' }}
        onNextRound={onNextRound}
        onNextTurn={jest.fn()}
        onTruco={jest.fn()}
        onEnvido={jest.fn()}
        onTrucoResponse={jest.fn()}
        onEnvidoResponse={jest.fn()}
      />
    );
    const button = screen.getByText('Siguiente Ronda');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onNextRound).toHaveBeenCalled();
  });
}); 