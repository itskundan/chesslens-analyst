import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { UploadSimple, Warning, CheckCircle, Info } from "@phosphor-icons/react"
import {
  parseCSV,
  parseImage,
  parsePgnTextInput,
  type ParseResult,
} from "@/lib/parseChessNotation"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGameLoaded: (pgn: string) => void
}

export function UploadDialog({
  open,
  onOpenChange,
  onGameLoaded,
}: UploadDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [result, setResult] = useState<ParseResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [inputMode, setInputMode] = useState<"file" | "pgn">("file")
  const [pgnInput, setPgnInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
      setProcessingStatus("")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setResult(null)
    setProcessingStatus("Processing file...")

    try {
      let parseResult: ParseResult

      const fileType = selectedFile.type
      const fileName = selectedFile.name.toLowerCase()

      if (fileType === "text/csv" || fileName.endsWith(".csv")) {
        setProcessingStatus("Parsing CSV file...")
        parseResult = await parseCSV(selectedFile)
      } else if (
        fileName.endsWith(".pgn") ||
        fileType === "application/x-chess-pgn" ||
        fileType === "application/vnd.chess-pgn" ||
        fileType === "text/plain"
      ) {
        setProcessingStatus("Parsing PGN file...")
        const text = await selectedFile.text()
        parseResult = await parsePgnTextInput(text)
      } else if (
        fileType.startsWith("image/") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg")
      ) {
        setProcessingStatus("Extracting text from image with OCR...")
        parseResult = await parseImage(selectedFile)
      } else {
        parseResult = {
          success: false,
          error: "Unsupported file format. Please upload CSV, PNG, or JPG files.",
        }
      }

      setResult(parseResult)

      if (parseResult.success && parseResult.pgn) {
        onGameLoaded(parseResult.pgn)
      }
    } catch (error) {
      setResult({
        success: false,
        error: `Unexpected error: ${error}`,
      })
    } finally {
      setIsProcessing(false)
      setProcessingStatus("")
    }
  }

    const handlePgnSubmit = async () => {
      if (!pgnInput.trim()) return

      setIsProcessing(true)
      setResult(null)
      setProcessingStatus("Validating PGN text...")

      try {
        const parseResult = await parsePgnTextInput(pgnInput)
        setResult(parseResult)

        if (parseResult.success && parseResult.pgn) {
          onGameLoaded(parseResult.pgn)
        }
      } catch (error) {
        setResult({
          success: false,
          error: `Unexpected error: ${error}`,
        })
      } finally {
        setIsProcessing(false)
        setProcessingStatus("")
      }
    }

    const handleModeChange = (value: string) => {
      const mode = value === "pgn" ? "pgn" : "file"
      setInputMode(mode)
      setResult(null)
      setProcessingStatus("")
      setIsProcessing(false)
    }

  const handleClose = () => {
    setSelectedFile(null)
    setResult(null)
    setIsProcessing(false)
    setProcessingStatus("")
      setPgnInput("")
      setInputMode("file")
    onOpenChange(false)
  }

    const canSubmit = inputMode === "file" ? Boolean(selectedFile) : Boolean(pgnInput.trim())
    const primaryLabel = result?.success
      ? "Done"
      : inputMode === "file"
        ? "Upload"
        : "Load PGN"

    const handlePrimaryAction = () => {
      if (result?.success) {
        handleClose()
        return
      }

      if (inputMode === "file") {
        void handleUpload()
      } else {
        void handlePgnSubmit()
      }
    }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Chess Game</DialogTitle>
          <DialogDescription>
              Upload a CSV/image/PGN file or paste PGN text to analyze the game
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-[2px]">
            <Tabs value={inputMode} onValueChange={handleModeChange}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="file">Upload File</TabsTrigger>
                <TabsTrigger value="pgn">Paste PGN</TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="mt-4 space-y-2">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors duration-200 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadSimple
                    size={48}
                    weight="regular"
                    className="mx-auto mb-4 text-muted-foreground"
                  />
                  <p className="text-sm text-foreground mb-2">
                    {selectedFile ? selectedFile.name : "Click to select file"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports CSV, PNG, JPG, and PGN files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.png,.jpg,.jpeg,.pgn,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  CSV: columns for White/Black. PGN: export from lichess, Chess.com, etc.
                </p>
              </TabsContent>

              <TabsContent value="pgn" className="mt-4 space-y-3">
                <Textarea
                  value={pgnInput}
                  onChange={(event) => setPgnInput(event.target.value)}
                  placeholder={`[Event "Casual Game"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6`}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  We handle headers, comments, nested variations, and shorthand castling automatically.
                </p>
              </TabsContent>
            </Tabs>

          {isProcessing && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{processingStatus}</p>
              <Progress value={undefined} className="w-full" />
              {processingStatus.includes("AI") && (
                <Alert className="transition-all duration-200">
                  <Info size={18} weight="regular" />
                  <AlertDescription className="text-xs">
                    Using AI vision model for enhanced accuracy...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {result && !isProcessing && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="transition-all duration-200"
            >
              {result.success ? (
                <CheckCircle size={18} weight="regular" />
              ) : (
                <Warning size={18} weight="regular" />
              )}
              <AlertDescription>
                {result.success
                  ? result.isPartial
                    ? `Loaded ${result.movesFound} move(s) - some moves could not be validated. Click "Done" to analyze.`
                    : `Successfully loaded ${result.movesFound} move(s). Click "Done" to start analyzing.`
                  : result.error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePrimaryAction}
            disabled={!canSubmit || isProcessing}
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
