import { useState, useCallback, useEffect, useRef } from "react"
import { Chess } from "chess.js"
import type { Square } from "chess.js"
import { getMoveHistory, createNewGame } from "@/lib/chessUtils"
import type { GameState } from "@/types/chess"

export function useChessGame() {
  const [game, setGame] = useState<Chess>(() => createNewGame())
  const [gameState, setGameState] = useState<GameState>({
    fen: createNewGame().fen(),
    pgn: "",
    moveHistory: [],
    currentMoveIndex: -1,
  })
  const [mainLinePgn, setMainLinePgn] = useState<string>("")
  const [isInAnalysisMode, setIsInAnalysisMode] = useState(false)
  const historyRef = useRef<string[]>([])

  const updateGameState = useCallback((chess: Chess, moveIndex?: number) => {
    const moveHistory = getMoveHistory(chess)
    const allMoves = chess.history()
    
    setGameState({
      fen: chess.fen(),
      pgn: chess.pgn(),
      moveHistory,
      currentMoveIndex: moveIndex ?? allMoves.length - 1,
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
    [game, updateGameState, mainLinePgn, isInAnalysisMode]
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
        
        if (allMoves.length === 0) {
          console.error("No moves loaded from PGN")
          return false
        }
        
        console.log(`Successfully loaded ${allMoves.length} moves`)
        
        historyRef.current = allMoves
        setGame(newGame)
        updateGameState(newGame)
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
            newGame.move(moves[i])
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

