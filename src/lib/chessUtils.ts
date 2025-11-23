import { Chess } from "chess.js"
import type { MoveHistoryItem } from "@/types/chess"

export function getMoveHistory(chess: Chess): MoveHistoryItem[] {
  const history = chess.history()
  const moves: MoveHistoryItem[] = []

  for (let i = 0; i < history.length; i += 2) {
    moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i] || null,
      black: history[i + 1] || null,
    })
  }

  return moves
}

export function createNewGame(): Chess {
  return new Chess()
}
