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
  try {
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

    if (!response.ok) {
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    return data.decision;
  } catch (error) {
    console.error('Error getting AI decision:', error);
    // Return a fallback decision if the API call fails
    return {
      cardIndex: Math.floor(Math.random() * opponentCards.length),
      explanation: 'Random choice due to API error',
    };
  }
}
