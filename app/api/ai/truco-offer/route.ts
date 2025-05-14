import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { aiCards, humanCards, muestraCard, trucoLevel, playedCards, roundState } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key is missing',
        decision: {
          accept: Math.random() < 0.5,
          explanation: 'Random choice (API key missing)'
        }
      }, { status: 200 });
    }

    const prompt = `
      Estás jugando Truco Uruguayo con muestra. El oponente te acaba de ofrecer "${trucoLevel}".
      Tus cartas: ${JSON.stringify(aiCards)}
      Cartas del oponente (lo que sabes): ${JSON.stringify(humanCards)}
      La muestra es: ${JSON.stringify(muestraCard)}
      Historial de manos jugadas en esta ronda: ${JSON.stringify(playedCards)}
      Estado de la ronda: ${JSON.stringify(roundState)}

      Recuerda:
      - Si aceptas, la ronda sigue y el ganador se lleva los puntos de "${trucoLevel}" (${trucoLevel === 'TRUCO' ? 2 : trucoLevel === 'RETRUCO' ? 3 : 4} puntos).
      - Si rechazas, el oponente se lleva los puntos anteriores (${trucoLevel === 'TRUCO' ? 1 : trucoLevel === 'RETRUCO' ? 2 : 3} puntos).
      - Tu objetivo es maximizar tus puntos y minimizar los del oponente.
      - Considera la fuerza de tus cartas, la muestra y el contexto de la ronda.

      ¿Aceptas o rechazas la oferta de "${trucoLevel}"? Responde SOLO con un objeto JSON:
      {
        "accept": true/false, // true si aceptas, false si rechazas
        "explanation": "Explica brevemente tu decisión."
      }
    `;

    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
      });
      const aiDecision = completion.choices[0].message.content;
      let parsedDecision;
      try {
        parsedDecision = aiDecision ? JSON.parse(aiDecision) : null;
      } catch {
        parsedDecision = {
          accept: Math.random() < 0.5,
          explanation: 'Random choice (parsing error)'
        };
      }
      return NextResponse.json({ decision: parsedDecision });
    } catch {
      return NextResponse.json({
        error: 'OpenAI API error',
        decision: {
          accept: Math.random() < 0.5,
          explanation: 'Random choice (OpenAI API error)'
        }
      });
    }
  } catch {
    return NextResponse.json({
      error: 'Failed to process truco offer',
      decision: {
        accept: Math.random() < 0.5,
        explanation: 'Random choice due to server error'
      }
    }, { status: 200 });
  }
} 