import { useState, useCallback, useEffect, useRef } from "react"
import { Chess } from "chess.js"
import type { Square, Move } from "chess.js"
import { getMoveHistory, createNewGame } from "@/lib/chessUtils"
import type { GameState, PlayedMove } from "@/types/chess"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]

function findKingSquare(chess: Chess, color: "w" | "b"): string | null {
  const board = chess.board()
  for (let rank = 0; rank < board.length; rank++) {
    for (let file = 0; file < board[rank].length; file++) {
      const piece = board[rank][file]
      if (piece && piece.type === "k" && piece.color === color) {
        return `${FILES[file]}${8 - rank}`
      }
    }
  }
  return null
}

export function useChessGame() {
  const [game, setGame] = useState<Chess>(() => createNewGame())
  const [gameState, setGameState] = useState<GameState>({
    fen: createNewGame().fen(),
    pgn: "",
    moveHistory: [],
    currentMoveIndex: -1,
    checkSquare: null,
    lastMove: null,
  })
  const [mainLinePgn, setMainLinePgn] = useState<string>("")
  const [isInAnalysisMode, setIsInAnalysisMode] = useState(false)
  const historyRef = useRef<PlayedMove[]>([])

  const updateGameState = useCallback((chess: Chess, moveIndex?: number, fullHistory?: PlayedMove[]) => {
    // Get full move history from either the passed fullHistory or stored historyRef
    const allMoves = fullHistory || historyRef.current
    
    // Create a new Chess instance with full game to get complete move history
    const fullGame = new Chess()
    for (const move of allMoves) {
      try {
        fullGame.move(move.san)
      } catch {
        break
      }
    }
    
    const moveHistory = getMoveHistory(allMoves)
    const verboseHistory = chess.history({ verbose: true }) as Move[]
    const recentMove = verboseHistory[verboseHistory.length - 1] ?? null
    const lastMove = recentMove ? { from: recentMove.from, to: recentMove.to } : null
    const colorToMove = chess.turn()
    const isInCheck = chess.inCheck()
    const checkSquare = isInCheck ? findKingSquare(chess, colorToMove) : null
    
    setGameState({
      fen: chess.fen(),
      pgn: fullGame.pgn(),
      moveHistory,
      currentMoveIndex: moveIndex ?? allMoves.length - 1,
      checkSquare,
      lastMove,
    })
  }, [])

  const makeMove = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      try {
        const gameCopy = new Chess(game.fen())
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        })

        if (move) {
          const currentIndex = gameState.currentMoveIndex
          const preservedMoves = historyRef.current.slice(0, currentIndex + 1)
          const newRecordedMove: PlayedMove = {
            san: move.san,
            isCustom: Boolean(mainLinePgn),
          }
          historyRef.current = [...preservedMoves, newRecordedMove]
          setGame(gameCopy)
          updateGameState(gameCopy)
          
          if (mainLinePgn && !isInAnalysisMode) {
            setIsInAnalysisMode(true)
          }
          
          return true
        }
        return false
      } catch {
        return false
      }
    },
    [game, updateGameState, mainLinePgn, isInAnalysisMode, gameState.currentMoveIndex]
  )

  const resetGame = useCallback(() => {
    const newGame = createNewGame()
    setGame(newGame)
    updateGameState(newGame)
    setMainLinePgn("")
    setIsInAnalysisMode(false)
    historyRef.current = []
  }, [updateGameState])

  const loadPgn = useCallback(
    (pgn: string) => {
      try {
        console.log("Attempting to load PGN:", pgn)
        const newGame = new Chess()
        
        const cleanPgn = pgn
          .replace(/```pgn\s*/gi, '')
          .replace(/```\s*/g, '')
          .replace(/\*\*/g, '')
          .replace(/##\s*/g, '')
          .replace(/0\s*-\s*0\s*-\s*0/g, 'O-O-O')
          .replace(/0\s*-\s*0/g, 'O-O')
          .replace(/[oО]\s*-\s*[oО]\s*-\s*[oО]/gi, 'O-O-O')
          .replace(/[oО]\s*-\s*[oО]/gi, 'O-O')
          .replace(/\bO\s*-\s*O\s*-\s*O\b/g, 'O-O-O')
          .replace(/\bO\s*-\s*O\b/g, 'O-O')
          .trim()
        
        console.log("Cleaned PGN:", cleanPgn)
        
        newGame.loadPgn(cleanPgn)
        
        const allMoves = newGame.history()
        const recordedMoves: PlayedMove[] = allMoves.map((san) => ({
          san,
          isCustom: false,
        }))
        
        if (recordedMoves.length === 0) {
          console.error("No moves loaded from PGN")
          return false
        }
        
        console.log(`Successfully loaded ${recordedMoves.length} moves`)
        
        historyRef.current = recordedMoves
        setGame(newGame)
        updateGameState(newGame, recordedMoves.length - 1, recordedMoves)
        setMainLinePgn(cleanPgn)
        setIsInAnalysisMode(false)
        return true
      } catch (error) {
        console.error("Error loading PGN:", error)
        return false
      }
    },
    [updateGameState]
  )

  const goToMove = useCallback(
    (moveIndex: number) => {
      try {
        const newGame = new Chess()
        const moves = historyRef.current

        for (let i = 0; i <= moveIndex; i++) {
          if (moves[i]) {
            newGame.move(moves[i].san)
          }
        }

        setGame(newGame)
        updateGameState(newGame, moveIndex)
        return true
      } catch {
        return false
      }
    },
    [updateGameState]
  )

  const goToFirst = useCallback(() => {
    const newGame = new Chess()
    if (mainLinePgn) {
      newGame.loadPgn(mainLinePgn)
      newGame.reset()
    }
    setGame(newGame)
    updateGameState(newGame, -1)
  }, [mainLinePgn, updateGameState])

  const goToPrevious = useCallback(() => {
    if (gameState.currentMoveIndex >= 0) {
      goToMove(gameState.currentMoveIndex - 1)
    }
  }, [gameState.currentMoveIndex, goToMove])

  const goToNext = useCallback(() => {
    const moves = historyRef.current
    if (gameState.currentMoveIndex < moves.length - 1) {
      goToMove(gameState.currentMoveIndex + 1)
    }
  }, [gameState.currentMoveIndex, goToMove])

  const goToLast = useCallback(() => {
    const moves = historyRef.current
    if (moves.length > 0) {
      goToMove(moves.length - 1)
    }
  }, [goToMove])

  const returnToMainGame = useCallback(() => {
    if (mainLinePgn) {
      loadPgn(mainLinePgn)
    }
  }, [mainLinePgn, loadPgn])

  return {
    game,
    gameState,
    makeMove,
    resetGame,
    loadPgn,
    goToMove,
    goToFirst,
    goToPrevious,
    goToNext,
    goToLast,
    isInAnalysisMode,
    returnToMainGame,
  }
}

