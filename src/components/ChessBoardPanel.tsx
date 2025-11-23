import { Card } from "@/components/ui/card"
import { Chessboard } from "react-chessboard"
import type { Square } from "chess.js"

interface ChessBoardPanelProps {
  position: string
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => boolean
  isAnalysisMode?: boolean
}

export function ChessBoardPanel({
  position,
  onPieceDrop,
  isAnalysisMode = false,
}: ChessBoardPanelProps) {
  const borderClass = isAnalysisMode
    ? "border-accent border-2"
    : "border-border"

  const handleDrop = (sourceSquare: string, targetSquare: string) => {
    return onPieceDrop(sourceSquare as Square, targetSquare as Square)
  }

  return (
    <Card className={`p-6 ${borderClass} transition-all duration-200`}>
      <div className="w-full">
        <Chessboard
          {...({ position } as any)}
          onPieceDrop={handleDrop}
          customBoardStyle={{
            borderRadius: "0.375rem",
          }}
        />
      </div>
    </Card>
  )
}
