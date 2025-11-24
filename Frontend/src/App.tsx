import { useState } from "react"
import { Navbar } from "@/components/Navbar"
import { ChessBoardPanel } from "@/components/ChessBoardPanel"
import { MoveListPanel } from "@/components/MoveListPanel"
import { NavigationControls } from "@/components/NavigationControls"
import { UploadDialog } from "@/components/UploadDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useChessGame } from "@/hooks/useChessGame"
import { useAutoPlay } from "@/hooks/useAutoPlay"
import { toast } from "sonner"
import { Warning } from "@phosphor-icons/react"
import type { Square } from "chess.js"

function App() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [qualityWarning, setQualityWarning] = useState<string | null>(null)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const {
    gameState,
    makeMove,
    loadPgn,
    goToMove,
    goToFirst,
    goToPrevious,
    goToNext,
    goToLast,
    isInAnalysisMode,
    returnToMainGame,
  } = useChessGame()

  const canGoNext = gameState.currentMoveIndex < gameState.moveHistory.length * 2 - 1
  
  const { isAutoPlaying, toggleAutoPlay } = useAutoPlay(
    goToNext,
    canGoNext
  )

  const handleUploadClick = () => {
    setUploadDialogOpen(true)
  }

  const handleGameLoaded = (pgn: string, warning?: string) => {
    const success = loadPgn(pgn)
    if (success) {
      toast.success("Game loaded successfully!")
      setUploadDialogOpen(false)
      
      // Only show warning dialog if there's actually a quality issue
      if (warning) {
        setQualityWarning(warning)
        setShowWarningDialog(true)
      } else {
        setQualityWarning(null)
        setShowWarningDialog(false)
      }
    } else {
      toast.error("Failed to load game. Please check the notation format.")
    }
  }

  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square) => {
    const success = makeMove(sourceSquare, targetSquare)
    if (!success) {
      toast.error("Illegal move")
    }
    return success
  }

  const handleMoveClick = (moveIndex: number) => {
    goToMove(moveIndex)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onUploadClick={handleUploadClick} />

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ChessBoardPanel
              position={gameState.fen}
              onPieceDrop={handlePieceDrop}
              isAnalysisMode={isInAnalysisMode}
              checkSquare={gameState.checkSquare}
              lastMove={gameState.lastMove}
            />
            <NavigationControls
              onFirst={goToFirst}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onLast={goToLast}
              onToggleAutoPlay={toggleAutoPlay}
              onReturnToMainGame={returnToMainGame}
              isAutoPlaying={isAutoPlaying}
              isAnalysisMode={isInAnalysisMode}
              disabled={gameState.moveHistory.length === 0}
            />
          </div>

          <div className="lg:col-span-1">
            <MoveListPanel
              moves={gameState.moveHistory}
              currentMoveIndex={gameState.currentMoveIndex}
              onMoveClick={handleMoveClick}
            />
          </div>
        </div>
      </main>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onGameLoaded={handleGameLoaded}
      />
      
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Warning size={24} weight="fill" className="text-yellow-600 dark:text-yellow-500" />
              </div>
              <AlertDialogTitle>Image Quality Warning</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              {qualityWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarningDialog(false)}>
              Okay, I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default App