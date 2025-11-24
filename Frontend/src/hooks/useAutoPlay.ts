import { useState, useEffect, useCallback } from "react"

export function useAutoPlay(
  onNext: () => void,
  canGoNext: boolean,
  interval: number = 2000
) {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!isPlaying || !canGoNext) {
      return
    }

    const timer = setInterval(() => {
      if (canGoNext) {
        onNext()
      } else {
        setIsPlaying(false)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, canGoNext, onNext, interval])

  const toggleAutoPlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const stopAutoPlay = useCallback(() => {
    setIsPlaying(false)
  }, [])

  return {
    isAutoPlaying: isPlaying,
    toggleAutoPlay,
    stopAutoPlay,
  }
}
