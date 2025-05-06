import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CardProps } from '@/app/components/Card';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerCards, opponentCards, middleCard, gameState } = body;

    // Create a prompt that describes the current game state
    const prompt = `
      You are playing a card game called Truco. Here's the current game state:
      
      Your cards (opponent): ${JSON.stringify(opponentCards)}
      Middle card: ${JSON.stringify(middleCard)}
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
    });

    // Extract the AI's decision
    const aiDecision = completion.choices[0].message.content;
    
    return NextResponse.json({ 
      decision: aiDecision ? JSON.parse(aiDecision) : null 
    });
  } catch (error) {
    console.error('Error in AI route:', error);
    return NextResponse.json(
      { error: 'Failed to process AI decision' },
      { status: 500 }
    );
  }
}
