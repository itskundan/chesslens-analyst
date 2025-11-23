export interface MoveHistoryItem {
  moveNumber: number
  white: string | null
  black: string | null
}

export interface GameState {
  fen: string
  pgn: string
  moveHistory: MoveHistoryItem[]
  currentMoveIndex: number
}
