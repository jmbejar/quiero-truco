import { CardProps } from '../components/Card';

interface AIDecision {
  cardIndex: number;
  explanation: string;
}

export async function getAIDecision(
  playerCards: CardProps[],
  opponentCards: CardProps[],
  middleCard: CardProps,
  gameState: string = 'Initial deal'
): Promise<AIDecision> {
  console.log('getAIDecision called with:', { playerCards, opponentCards, middleCard, gameState });
  
  try {
    console.log('Sending request to /api/ai');
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerCards,
        opponentCards,
        middleCard,
        gameState,
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
