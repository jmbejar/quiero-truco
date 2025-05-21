import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { calculateEnvidoPoints } from '@/app/utils/gameUtils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { aiCards, humanCards, muestraCard, playedCards, roundState } = body;

    // Calculate AI envido points
    const aiPoints = calculateEnvidoPoints(aiCards, muestraCard);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key is missing',
        decision: {
          action: Math.random() < 0.5 ? 'accept' : 'reject',
          explanation: 'Random choice (API key missing)',
          points: aiPoints
        }
      }, { status: 200 });
    }

    const prompt = `
      Estás jugando Truco Uruguayo con muestra. El oponente te acaba de ofrecer "Envido".
      Tus cartas: ${JSON.stringify(aiCards)}
      Tus puntos de envido: ${aiPoints}
      Cartas del oponente (lo que sabes): ${JSON.stringify(humanCards)}
      La muestra es: ${JSON.stringify(muestraCard)}
      Historial de manos jugadas en esta ronda: ${JSON.stringify(playedCards)}
      Estado de la ronda: ${JSON.stringify(roundState)}

      Recuerda:
      - Si aceptas, ambos comparan sus puntos de envido y el ganador obtiene 2 puntos.
      - Si rechazas, el oponente obtiene 1 punto.
      - Tu objetivo es maximizar tus puntos y minimizar los del oponente.
      - Considera la fuerza de tus puntos de envido (${aiPoints}) y la probabilidad de que el oponente tenga más puntos.

      ¿Qué decides? Responde SOLO con un objeto JSON:
      {
        "action": "accept" | "reject", // "accept" para aceptar, "reject" para rechazar
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
        parsedDecision.points = aiPoints;
      } catch {
        parsedDecision = {
          action: Math.random() < 0.5 ? 'accept' : 'reject',
          explanation: 'Random choice (parsing error)',
          points: aiPoints
        };
      }
      return NextResponse.json({ decision: parsedDecision });
    } catch {
      return NextResponse.json({
        error: 'OpenAI API error',
        decision: {
          action: Math.random() < 0.5 ? 'accept' : 'reject',
          explanation: 'Random choice (OpenAI API error)',
          points: aiPoints
        }
      });
    }
  } catch (error) {
    console.error('Error in envido-offer API:', error);
    return NextResponse.json({
      error: 'Failed to process envido offer',
      decision: {
        action: Math.random() < 0.5 ? 'accept' : 'reject',
        explanation: 'Random choice due to server error',
        points: 0
      }
    }, { status: 200 });
  }
}