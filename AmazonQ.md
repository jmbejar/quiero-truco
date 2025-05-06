# Quiero Truco - Card Game Implementation

This project implements a simple card game interface using Next.js and React. The game displays cards in a specific layout:
- 3 cards at the top (opponent's cards)
- 1 card in the middle (played card)
- 3 cards at the bottom (player's cards)

## Components

### Card Component
- Displays a single card with a number (1-12) and a "palo" (oro, basto, espada, or copa)
- Located in `app/components/Card.tsx`

### GameBoard Component
- Arranges the cards in the specified layout
- Located in `app/components/GameBoard.tsx`

## Running the Project

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) to see the card game interface.

## Next Steps
- Add card selection functionality
- Implement game logic
- Add animations for card movements
- Create a scoring system
