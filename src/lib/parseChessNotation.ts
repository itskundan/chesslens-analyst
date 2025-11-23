import Papa from "papaparse"
import { createWorker } from "tesseract.js"

export interface ParseResult {
  success: boolean
  pgn?: string
  error?: string
  movesFound?: number
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const data = results.data as Array<Record<string, string>>
          let pgn = ""
          let moveNumber = 1

          for (const row of data) {
            const white = row.White || row.white || ""
            const black = row.Black || row.black || ""

            if (!white && !black) continue

            if (white) {
              pgn += `${moveNumber}. ${white.trim()} `
            }
            if (black) {
              pgn += `${black.trim()} `
            }
            moveNumber++
          }

          if (pgn.trim().length === 0) {
            resolve({
              success: false,
              error: "No valid chess moves found in CSV",
            })
          } else {
            resolve({
              success: true,
              pgn: pgn.trim(),
              movesFound: moveNumber - 1,
            })
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse CSV: ${error}`,
          })
        }
      },
      error: (error) => {
        resolve({
          success: false,
          error: `CSV parsing error: ${error.message}`,
        })
      },
    })
  })
}

export async function parseImage(file: File): Promise<ParseResult> {
  try {
    const worker = await createWorker("eng")

    const {
      data: { text },
    } = await worker.recognize(file)

    await worker.terminate()

    const cleanedText = extractChessMoves(text)

    if (!cleanedText) {
      return {
        success: false,
        error: "Could not detect chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    const moveCount = (cleanedText.match(/\d+\./g) || []).length

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
    }
  } catch (error) {
    return {
      success: false,
      error: `OCR processing failed: ${error}`,
    }
  }
}

function extractChessMoves(text: string): string {
  const lines = text.split("\n")
  let pgnText = ""

  const movePattern = /\d+\.\s*([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?)\s*([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?)?/g

  for (const line of lines) {
    const matches = line.match(movePattern)
    if (matches) {
      for (const match of matches) {
        pgnText += match + " "
      }
    }
  }

  const castlingPattern = /(O-O-O|O-O)/g
  for (const line of lines) {
    const castlingMatches = line.match(castlingPattern)
    if (castlingMatches) {
      for (const match of castlingMatches) {
        pgnText += match + " "
      }
    }
  }

  return pgnText.trim()
}
