import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CardProps } from '@/app/components/Card';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log('AI API route called');
  
  try {
    const body = await request.json();
    const { playerCards, opponentCards, middleCard, gameState } = body;
    
    console.log('Request body:', { playerCards, opponentCards, middleCard, gameState });
    console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY);

    // Check if API key is missing
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { 
          error: 'OpenAI API key is missing',
          decision: {
            cardIndex: Math.floor(Math.random() * opponentCards.length),
            explanation: 'Random choice (API key missing)'
          }
        },
        { status: 200 }
      );
    }

    // Create a prompt that describes the current game state
    const prompt = `
      You are playing Truco Uruguayo and we expect you know the rules. Here's the current game state:
      
      Your cards (opponent): ${JSON.stringify(opponentCards)}
      Middle card ("la muestra"): ${JSON.stringify(middleCard)}
      Player's visible cards: ${JSON.stringify(playerCards)}
      
      Game state: ${gameState || 'Initial deal'}
      
      Based on this information, what card would you play next and why? 
      Respond with a JSON object containing:
      1. The card you want to play (index of the card in your hand, 0-2)
      2. A brief explanation of your strategy
      
      Example response:
      {
        "cardIndex": 1,
        "explanation": "I'm playing the 7 of oro because it's a strong card that can win this round."
      }
    `;

    console.log('Sending request to OpenAI');
    
    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
      });

      console.log('OpenAI response received:', completion.choices[0].message);
      
      // Extract the AI's decision
      const aiDecision = completion.choices[0].message.content;
      let parsedDecision;
      
      try {
        parsedDecision = aiDecision ? JSON.parse(aiDecision) : null;
        console.log('Parsed decision:', parsedDecision);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw AI response:', aiDecision);
        
        // Fallback if parsing fails
        parsedDecision = {
          cardIndex: Math.floor(Math.random() * opponentCards.length),
          explanation: 'Random choice (parsing error)'
        };
      }
      
      return NextResponse.json({ decision: parsedDecision });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Return a fallback decision if OpenAI call fails
      return NextResponse.json({
        error: 'OpenAI API error',
        decision: {
          cardIndex: Math.floor(Math.random() * opponentCards.length),
          explanation: 'Random choice (OpenAI API error)'
        }
      });
    }
  } catch (error) {
    console.error('Error in AI route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process AI decision',
        decision: {
          cardIndex: 0,
          explanation: 'Random choice due to server error'
        }
      },
      { status: 200 } // Return 200 with fallback to avoid breaking the game
    );
  }
}
