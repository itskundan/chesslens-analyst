import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileImage, 
  TextAa, 
  Strategy, 
  CheckCircle,
  CircleNotch,
  Eye,
  MagicWand,
  Target
} from "@phosphor-icons/react"

interface GameLoadingOverlayProps {
  isLoading: boolean
  stage: "uploading" | "extracting" | "validating" | "complete"
}

const loadingMessages = [
  {
    icon: FileImage,
    title: "Opening Your Scoresheet",
    description: "Preparing your image for analysis...",
    color: "text-blue-500",
    gradient: "from-blue-500/20 to-blue-600/20",
  },
  {
    icon: Eye,
    title: "Reading Handwriting",
    description: "AI is carefully examining each move notation...",
    color: "text-indigo-500",
    gradient: "from-indigo-500/20 to-indigo-600/20",
  },
  {
    icon: TextAa,
    title: "Extracting Chess Moves",
    description: "Converting handwritten text to digital format...",
    color: "text-purple-500",
    gradient: "from-purple-500/20 to-purple-600/20",
  },
  {
    icon: MagicWand,
    title: "Validating Notation",
    description: "Ensuring all moves follow chess rules...",
    color: "text-pink-500",
    gradient: "from-pink-500/20 to-pink-600/20",
  },
  {
    icon: Strategy,
    title: "Setting Up the Board",
    description: "Placing pieces and preparing your game...",
    color: "text-amber-500",
    gradient: "from-amber-500/20 to-amber-600/20",
  },
  {
    icon: Target,
    title: "Finalizing Analysis",
    description: "Getting everything ready for you...",
    color: "text-orange-500",
    gradient: "from-orange-500/20 to-orange-600/20",
  },
  {
    icon: CheckCircle,
    title: "Your Game is Ready!",
    description: "Time to analyze your brilliant chess game 🎉",
    color: "text-green-500",
    gradient: "from-green-500/20 to-green-600/20",
  },
]

export function GameLoadingOverlay({ isLoading, stage }: GameLoadingOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const currentMessage = loadingMessages[currentMessageIndex]
  const Icon = currentMessage.icon

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0)
      return
    }

    // Auto-cycle through messages for better engagement
    let interval: NodeJS.Timeout
    
    if (stage === "uploading") {
      setCurrentMessageIndex(0)
      interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev < 1 ? prev + 1 : prev))
      }, 1500)
    } else if (stage === "extracting") {
      setCurrentMessageIndex(2)
      interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev < 3 ? prev + 1 : prev))
      }, 1800)
    } else if (stage === "validating") {
      setCurrentMessageIndex(4)
      interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev < 5 ? prev + 1 : prev))
      }, 1500)
    } else if (stage === "complete") {
      setCurrentMessageIndex(6)
    }

    return () => clearInterval(interval)
  }, [isLoading, stage])

  const progress = ((currentMessageIndex + 1) / loadingMessages.length) * 100

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative w-[90vw] max-w-lg"
          >
            {/* Animated gradient border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 animate-pulse" />
            
            {/* Main content card */}
            <div className="relative bg-background/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-border/50">
              <div className="flex flex-col items-center text-center space-y-8">
                {/* Animated icon */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ scale: 0, rotate: -90, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 90, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="relative"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentMessage.gradient} rounded-full blur-2xl`} />
                    <div className="relative p-6 bg-background/80 backdrop-blur-sm rounded-full border border-border/30 shadow-lg">
                      {stage === "complete" ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                          <Icon size={56} weight="fill" className={currentMessage.color} />
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <CircleNotch size={56} weight="bold" className={currentMessage.color} />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Text content with smooth transitions */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex + "-text"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {currentMessage.title}
                    </h2>
                    <p className="text-muted-foreground text-base max-w-md">
                      {currentMessage.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="w-full space-y-3">
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {stage === "complete" ? "Complete" : "Processing..."}
                    </span>
                    <span className={`font-medium ${currentMessage.color}`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Animated dots - only show when not complete */}
                {stage !== "complete" && (
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full ${currentMessage.color.replace('text-', 'bg-')}`}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

