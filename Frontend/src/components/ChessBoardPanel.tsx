import { useMemo, useCallback, useState, useEffect } from "react"
import type { CSSProperties } from "react"
import { Card } from "@/components/ui/card"
import { Chessboard } from "react-chessboard"
import { Chess } from "chess.js"
import type { Square, Move } from "chess.js"
import type { PieceDropHandlerArgs, SquareHandlerArgs, PieceHandlerArgs } from "react-chessboard/dist/types"
import type { LastMove } from "@/types/chess"

interface ChessBoardPanelProps {
  position: string
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => boolean
  isAnalysisMode?: boolean
  checkSquare?: string | null
  lastMove?: LastMove | null
}

export function ChessBoardPanel({
  position,
  onPieceDrop,
  isAnalysisMode = false,
  checkSquare = null,
  lastMove = null,
}: ChessBoardPanelProps) {
  const borderClass = isAnalysisMode
    ? "border-accent border-2"
    : "border-border"

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalTargets, setLegalTargets] = useState<Array<{ square: Square; isCapture: boolean }>>([])

  const clearHighlights = useCallback(() => {
    setSelectedSquare(null)
    setLegalTargets([])
  }, [])

  const handleDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!targetSquare) return false
    const success = onPieceDrop(sourceSquare as Square, targetSquare as Square)
    if (success) {
      clearHighlights()
    }
    return success
  }, [onPieceDrop, clearHighlights])

  const getLegalMoves = useCallback((square: Square) => {
    try {
      const chess = new Chess()
      chess.load(position)
      return chess.moves({ square, verbose: true }) as Move[]
    } catch {
      return []
    }
  }, [position])

  const showLegalTargets = useCallback((square: Square) => {
    const legalMoves = getLegalMoves(square)

    if (legalMoves.length === 0) {
      clearHighlights()
      return false
    }

    setSelectedSquare(square)
    setLegalTargets(
      legalMoves.map((move) => ({
        square: move.to as Square,
        isCapture: Boolean(move.captured),
      }))
    )

    return true
  }, [getLegalMoves, clearHighlights])

  const handleSquareClick = useCallback(({ square }: SquareHandlerArgs) => {
    const normalizedSquare = square as Square

    const targetInfo = legalTargets.find((target) => target.square === normalizedSquare)

    if (selectedSquare && targetInfo) {
      const moved = onPieceDrop(selectedSquare, targetInfo.square)
      if (moved) {
        clearHighlights()
      }
      return
    }

    if (selectedSquare === normalizedSquare) {
      clearHighlights()
      return
    }

    showLegalTargets(normalizedSquare)
  }, [selectedSquare, legalTargets, onPieceDrop, clearHighlights, showLegalTargets])

  const handlePieceDrag = useCallback(({ square }: PieceHandlerArgs) => {
    if (!square) return
    showLegalTargets(square as Square)
  }, [showLegalTargets])

  useEffect(() => {
    clearHighlights()
  }, [position, clearHighlights])

  const moveHighlightStyles = useMemo(() => {
    if (!selectedSquare && legalTargets.length === 0) {
      return undefined
    }

    const styles: Record<string, CSSProperties> = {}

    if (selectedSquare) {
      styles[selectedSquare] = {
        boxShadow: "inset 0 0 0 3px rgba(251, 191, 36, 0.9)",
        backgroundColor: "rgba(251, 191, 36, 0.3)",
      }
    }

    legalTargets.forEach(({ square, isCapture }) => {
      if (isCapture) {
        styles[square] = {
          backgroundColor: "rgba(16, 185, 129, 0.18)",
          boxShadow: "inset 0 0 0 2px rgba(16, 185, 129, 0.45)",
        }
        return
      }

      styles[square] = {
        backgroundImage: "radial-gradient(circle, rgba(16,185,129,0.85) 0%, rgba(16,185,129,0.45) 26%, transparent 32%)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "42%",
      }
    })

    return styles
  }, [selectedSquare, legalTargets])

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}

    if (lastMove) {
      const lastMoveStyle: CSSProperties = {
        backgroundColor: "rgba(134, 239, 172, 0.4)",
        boxShadow: "inset 0 0 0 2px rgba(16, 185, 129, 0.35)",
      }
      styles[lastMove.from] = lastMoveStyle
      styles[lastMove.to] = lastMoveStyle
    }

    if (moveHighlightStyles) {
      Object.assign(styles, moveHighlightStyles)
    }

    if (checkSquare) {
      styles[checkSquare] = {
        boxShadow: "inset 0 0 0 3px rgba(239,68,68,0.9)",
        backgroundColor: "rgba(239,68,68,0.3)",
      }
    }

    return Object.keys(styles).length ? styles : undefined
  }, [checkSquare, moveHighlightStyles, lastMove])

  const boardOptions = useMemo(() => ({
    id: "analysis-board",
    position,
    allowDragging: true,
    showAnimations: true,
    animationDurationInMs: 350,
    boardStyle: {
      borderRadius: "0.375rem",
    },
    squareStyles,
    onPieceDrop: handleDrop,
    onSquareClick: handleSquareClick,
    onPieceDrag: handlePieceDrag,
  }), [position, handleDrop, squareStyles, handleSquareClick, handlePieceDrag])

  return (
    <Card className={`p-6 ${borderClass} transition-all duration-200`}>
      <div className="w-full">
        <Chessboard options={boardOptions} />
      </div>
    </Card>
  )
}
