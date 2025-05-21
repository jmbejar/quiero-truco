import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CardProps } from '@/app/components/Card';
import { hasFlor } from '@/app/utils/gameUtils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log('AI API route called');
  
  try {
    const body = await request.json();
    const { playerPlayedCard, opponentCards, middleCard, gamePhase, trucoState, playedCards, availableTrucoAction, envidoState } = body;
    
    console.log('Request body:', { playerPlayedCard, opponentCards, middleCard, gamePhase, trucoState, playedCards, availableTrucoAction, envidoState });
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

    // Determine if AI should offer envido
    const canOfferEnvido = 
      playedCards.length === 0 && 
      envidoState.type === 'NONE' && 
      trucoState.type === 'NONE' && 
      !hasFlor(opponentCards, middleCard);
    
    // The LLM will decide whether to offer envido or not
    const shouldOfferEnvido = false; // Initial value, will be set by LLM decision

    // Create a prompt that describes the current game state
    const prompt = `
      Estás jugando Truco Uruguayo con muestra. Aquí está el estado actual del juego:
      
      Recuerda que el objetivo es ganar la ronda (dos turnos) así que puede convenir o no jugar la carta más fuerte.
      ${availableTrucoAction.type !== 'NONE' && trucoState.lastCaller !== 'ai' ? `A su vez, puedes intentar decir ${availableTrucoAction.type.toLowerCase()} si te conviene, porque asigna más puntos y tu objetivo es ganar todos los puntos posibles.` : ''}
      ${canOfferEnvido ? 'También puedes ofrecer "envido" antes de jugar tu primera carta (el ganador obtiene 2 puntos, o 1 punto si es rechazado).' : ''}

      Te recordaré como se define qué carta gana en cada ronda. Se compara según el valor de las cartas, que es el siguiente (en orden de fuerza decreciente):
      - El 2, 4, 5, 10 y 11 con el mismo palo que la carta de la muestra son las más fuertes en ese orden.
      - Cartas especiales ("matas"): El 1 de espada, el 1 de basto, el 7 de espada y el 7 de oro, en ese orden.
      - 3 de cualquier palo
      - 2 de cualquier palo
      - 1 de cualquier palo
      - El resto de las cartas según su valor nominal

      Ejemplos (con el 3 de oro como carta de la muestra):
      - 3 de basto gana a 2 de basto (porque el 3 es más fuerte que el 2)
      - 1 de espada gana a 3 de basto (porque el 1 de espada es una "mata" y el 3 de basto no)
      - 7 de oro pierde con el 1 de espada (porque ambas son "matas" pero el 1 de espada es más fuerte que el 7 de oro)
      - 5 de oro gana a 3 de basto (porque este 5 tiene el mismo palo que la carta de la muestra, y es uno de los valores que se activa con la muestra y está en la categoría más fuerte)
      - 4 de oro gana a 11 de espada (porque este 4 tiene el mismo palo que la carta de la muestra, y es uno de los valores que se activa con la muestra y está en la categoría más fuerte)
      - 6 de oro pierde con 10 de copa (porque si bien el 6 tiene el mismo palo que la carta de la muestra, no es uno de los valores que se activa con la muestra, entonces se toma su valor nominal)

      Tus cartas (oponente): ${JSON.stringify(opponentCards)}
      La muestra es: ${JSON.stringify(middleCard)}
      Carta jugada por el oponente: ${JSON.stringify(playerPlayedCard)}
      
      Historial de manos en esta ronda:
      ${playedCards.length > 0 ? playedCards.map((card: CardProps, index: number) => {
        const isPlayerCard = index % 2 === 0;
        return `Mano ${Math.floor(index/2) + 1}: ${isPlayerCard ? 'Jugador' : 'AI'} jugó ${JSON.stringify(card)}`;
      }).join('\n') : 'No se han jugado manos en esta ronda'}
      
      Estado del juego: ${gamePhase || 'Reparto inicial'}
      
      Basado en esta información, ¿qué carta jugarías y por qué?${availableTrucoAction.type !== 'NONE' && trucoState.lastCaller !== 'ai' ? ` También debes decidir si quieres decir "${availableTrucoAction.type}" o no.` : ''}${canOfferEnvido ? ' También debes decidir si quieres ofrecer "envido" o no.' : ''}
      Responde con un objeto JSON que contenga:
      1. La carta que quieres jugar (índice de la carta en tu mano, 0-2)
      2. Una breve explicación de tu estrategia${availableTrucoAction.type !== 'NONE' && trucoState.lastCaller !== 'ai' ? `\\n      3. Si quieres decir "${availableTrucoAction.type}" o no (wantsTrucoAction: "${availableTrucoAction.type}" o null)` : ''}${canOfferEnvido ? '\\n      ' + (availableTrucoAction.type !== 'NONE' && trucoState.lastCaller !== 'ai' ? '4' : '3') + '. Si quieres ofrecer "envido" o no (wantsEnvido: true o false)' : ''}
      
      Ejemplo de respuesta:
      {
        "cardIndex": 1,
        "explanation": "Estoy jugando el 7 de oro porque es una carta fuerte que puede ganar esta ronda."${availableTrucoAction.type !== 'NONE' && trucoState.lastCaller !== 'ai' ? `,\\n        "wantsTrucoAction": "${availableTrucoAction.type}"` : ''}${canOfferEnvido ? ',\\n        "wantsEnvido": true' : ''}
      }
    `;

    console.log('Sending request to OpenAI');
    
    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
      });

      console.log('OpenAI response received:', completion.choices[0].message);
      
      // Extract the AI's decision
      const aiDecision = completion.choices[0].message.content;
      let parsedDecision;
      
      try {
        parsedDecision = aiDecision ? JSON.parse(aiDecision) : null;
        console.log('Parsed decision:', parsedDecision);

        // Ensure wantsTrucoAction is properly formatted
        if (parsedDecision?.wantsTrucoAction && availableTrucoAction.type !== 'NONE') {
          parsedDecision.wantsTrucoAction = { type: availableTrucoAction.type };
        } else {
          parsedDecision.wantsTrucoAction = { type: 'NONE' };
        }
        
        // Let the LLM's decision determine whether to offer envido
        if (parsedDecision?.wantsEnvido && canOfferEnvido) {
          parsedDecision.wantsEnvido = true;
        } else {
          parsedDecision.wantsEnvido = false;
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw AI response:', aiDecision);
        
        // Fallback if parsing fails
        parsedDecision = {
          cardIndex: Math.floor(Math.random() * opponentCards.length),
          explanation: 'Random choice (parsing error)',
          wantsEnvido: shouldOfferEnvido
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
          explanation: 'Random choice (OpenAI API error)',
          wantsEnvido: shouldOfferEnvido
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
