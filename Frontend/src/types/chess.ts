export interface PlayedMove {
  san: string
  isCustom: boolean
}

export interface MoveHistoryItem {
  moveNumber: number
  white: PlayedMove | null
  black: PlayedMove | null
}

export interface LastMove {
  from: string
  to: string
}

export interface GameState {
  fen: string
  pgn: string
  moveHistory: MoveHistoryItem[]
  currentMoveIndex: number
  checkSquare?: string | null
  lastMove?: LastMove | null
}
