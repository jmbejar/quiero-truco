import { CardProps } from '../components/Card';
import { GamePhase, TrucoState, AvailableTrucoAction, RoundState } from '../types/game';

export interface AIDecision {
  cardIndex: number;
  explanation: string;
  wantsTrucoAction?: AvailableTrucoAction;  // specifies which truco action the AI wants to call
}

export interface TrucoOfferAIDecision {
  accept: boolean;
  explanation: string;
}

export async function getAIDecision(
playerPlayedCard: CardProps | null, opponentCards: CardProps[], middleCard: CardProps, gamePhase: GamePhase, trucoState: TrucoState, playedCards: CardProps[] = []): Promise<AIDecision> {
  console.log('getAIDecision called with:', { playerPlayedCard, opponentCards, middleCard, gamePhase, trucoState, playedCards });
  
  // Determine what truco-related actions are available
  const availableTrucoAction: AvailableTrucoAction = (() => {
    if (trucoState.lastCaller === 'AI') return { type: 'NONE' };
    if (trucoState.type === 'NONE') return { type: 'TRUCO' };
    if (trucoState.type === 'ACCEPTED' && trucoState.level === 'TRUCO') return { type: 'RETRUCO' };
    if (trucoState.type === 'ACCEPTED' && trucoState.level === 'RETRUCO') return { type: 'VALE4' };
    return { type: 'NONE' };
  })();
  
  try {
    console.log('Sending request to /api/ai');
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerPlayedCard,
        opponentCards,
        middleCard,
        gamePhase: gamePhase.type,
        trucoState: trucoState.type,
        playedCards,
        availableTrucoAction
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    if (!data.decision) {
      console.error('No decision in API response');
      throw new Error('No decision returned from AI API');
    }
    
    return data.decision;
  } catch (error) {
    console.error('Error in getAIDecision:', error);
    // Return a fallback decision if the API call fails
    const fallbackDecision = {
      cardIndex: Math.floor(Math.random() * opponentCards.length),
      explanation: 'Random choice due to API error',
    };
    console.log('Using fallback decision:', fallbackDecision);
    return fallbackDecision;
  }
}

export async function getTrucoOfferAIDecision(
  aiCards: CardProps[],
  humanCards: CardProps[],
  muestraCard: CardProps,
  trucoLevel: 'TRUCO' | 'RETRUCO' | 'VALE4',
  playedCards: CardProps[],
  roundState: RoundState
): Promise<TrucoOfferAIDecision> {
  try {
    const response = await fetch('/api/ai/truco-offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aiCards,
        humanCards,
        muestraCard,
        trucoLevel,
        playedCards,
        roundState,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to get truco offer decision');
    }
    const data = await response.json();
    if (!data.decision) {
      throw new Error('No decision returned from AI API');
    }
    return data.decision;
  } catch (error) {
    console.error('Error in getTrucoOfferAIDecision:', error);
    // Fallback: random accept/reject
    return {
      accept: Math.random() < 0.5,
      explanation: 'Random choice due to API error',
    };
  }
}
