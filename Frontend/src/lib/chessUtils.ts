import { Chess } from "chess.js"
import type { MoveHistoryItem, PlayedMove } from "@/types/chess"

export function getMoveHistory(playedMoves: PlayedMove[]): MoveHistoryItem[] {
  const moves: MoveHistoryItem[] = []

  for (let i = 0; i < playedMoves.length; i += 2) {
    moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: playedMoves[i] ? { ...playedMoves[i] } : null,
      black: playedMoves[i + 1] ? { ...playedMoves[i + 1] } : null,
    })
  }

  return moves
}

export function createNewGame(): Chess {
  return new Chess()
}
