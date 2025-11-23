import {
  SkipBack,
  CaretLeft,
  CaretRight,
  SkipForward,
  Play,
  Pause,
  ArrowCounterClockwise,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface NavigationControlsProps {
  onFirst?: () => void
  onPrevious?: () => void
  onNext?: () => void
  onLast?: () => void
  onToggleAutoPlay?: () => void
  onReturnToMainGame?: () => void
  isAutoPlaying?: boolean
  isAnalysisMode?: boolean
  disabled?: boolean
}

export function NavigationControls({
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onToggleAutoPlay,
  onReturnToMainGame,
  isAutoPlaying = false,
  isAnalysisMode = false,
  disabled = false,
}: NavigationControlsProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onFirst}
            disabled={disabled}
            className="transition-all duration-200"
          >
            <SkipBack size={18} weight="regular" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onPrevious}
            disabled={disabled}
            className="transition-all duration-200"
          >
            <CaretLeft size={18} weight="regular" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleAutoPlay}
            disabled={disabled}
            className="transition-all duration-200 min-w-[80px]"
          >
            {isAutoPlaying ? (
              <>
                <Pause size={18} weight="regular" className="mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play size={18} weight="regular" className="mr-2" />
                Play
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onNext}
            disabled={disabled}
            className="transition-all duration-200"
          >
            <CaretRight size={18} weight="regular" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onLast}
            disabled={disabled}
            className="transition-all duration-200"
          >
            <SkipForward size={18} weight="regular" />
          </Button>
        </div>

        {isAnalysisMode && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onReturnToMainGame}
            className="transition-all duration-200"
          >
            <ArrowCounterClockwise size={18} weight="regular" className="mr-2" />
            Return to Main Game
          </Button>
        )}
      </div>
    </Card>
  )
}
