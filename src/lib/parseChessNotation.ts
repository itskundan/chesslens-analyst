import Papa from "papaparse"
import { createWorker, PSM } from "tesseract.js"
import { Chess } from "chess.js"

export interface ParseResult {
  success: boolean
  pgn?: string
  error?: string
  movesFound?: number
  isPartial?: boolean
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
    const worker = await createWorker("eng", 1, {
      logger: () => {},
    })

    await worker.setParameters({
      tessedit_char_whitelist: 'abcdefghKQRBNOox012345678.-+=# ',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    })

    const {
      data: { text },
    } = await worker.recognize(file)

    await worker.terminate()

    const cleanedText = extractChessMoves(text)

    if (!cleanedText) {
      console.log("Tesseract OCR failed to extract valid PGN, falling back to Gemini vision API...")
      return await parseImageWithGemini(file)
    }

    const validationResult = validatePgnWithDetails(cleanedText)
    if (!validationResult.valid) {
      console.log("Tesseract OCR failed to extract valid PGN, falling back to Gemini vision API...")
      return await parseImageWithGemini(file)
    }

    const moveCount = (cleanedText.match(/\d+\./g) || []).length

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
    }
  } catch (error) {
    console.log("Tesseract OCR error, falling back to Gemini vision API...")
    return await parseImageWithGemini(file)
  }
}

async function parseImageWithGemini(file: File): Promise<ParseResult> {
  try {
    const base64Image = await fileToBase64(file)
    const base64Data = base64Image.split(',')[1]
    const mimeType = file.type || 'image/jpeg'
    
    const API_KEY = "AIzaSyAa-8Cwh6_XixZemMocbQ3wRAI_KG_6KYE"
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
    
    const promptText = `You are a chess notation expert. Analyze this image which contains chess game notation and extract all the moves in standard PGN format.

CRITICAL REQUIREMENTS:
1. Extract moves in standard algebraic notation (e.g., e4, Nf3, Bxc6, O-O)
2. Format as: 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
3. For castling moves (VERY IMPORTANT):
   - If you see "0-0" (with zeros), convert it to: O-O (capital letter O)
   - If you see "0-0-0" (with zeros), convert it to: O-O-O (capital letter O)
   - Kingside castling must be: O-O (capital letter O, NOT zero)
   - Queenside castling must be: O-O-O (capital letter O, NOT zero)
   - The image may show zeros (0-0) but you MUST output capital O (O-O)
4. Include move numbers followed by a period and space
5. Separate white and black moves with spaces
6. Return ONLY the raw PGN moves without any formatting, code blocks, or explanations
7. Do NOT wrap in markdown code blocks
8. Do NOT add any text before or after the moves
9. If no chess notation found, return exactly: NO_NOTATION_FOUND
10. Double check that every move is valid and makes sense in sequence
11. Look carefully at the board position after each move - if a move doesn't make sense, try to interpret what was intended
12. Common issues to watch for:
    - "l" (lowercase L) vs "1" (number one)
    - "O" (letter) vs "0" (zero) in castling
    - "S" or "K" for knight (should be "N")

Example correct format: 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7

Extract the moves now:`

    const requestBody = {
      contents: [{
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }]
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} - ${await response.text()}`)
    }

    const data = await response.json()
    let geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
    
    if (geminiResponse === "NO_NOTATION_FOUND" || geminiResponse.length < 5) {
      return {
        success: false,
        error: "Could not detect chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    geminiResponse = geminiResponse
      .replace(/```pgn\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/##\s*/g, '')
      .trim()
    
    geminiResponse = normalizeCastling(geminiResponse)

    const cleanedText = extractChessMoves(geminiResponse)
    
    console.log("Gemini response:", geminiResponse)
    console.log("Cleaned PGN:", cleanedText)
    
    if (!cleanedText || cleanedText.length < 5) {
      return {
        success: false,
        error: "Could not detect valid chess notation in image. Please ensure the image is clear and contains standard algebraic notation.",
      }
    }

    const validationResult = validatePgnWithDetails(cleanedText)
    if (!validationResult.valid) {
      console.error("Extracted PGN failed validation at move:", validationResult.failedAt)
      console.error("Full PGN:", cleanedText)
      
      if (validationResult.partialPgn && validationResult.moveCount > 0) {
        return {
          success: true,
          pgn: validationResult.partialPgn,
          movesFound: validationResult.moveCount,
          isPartial: true,
        }
      }
      
      return {
        success: false,
        error: `Extracted notation is not valid chess moves. Failed at move ${validationResult.failedAt}. Please check the image quality and try again.`,
      }
    }

    const moveCount = (cleanedText.match(/\d+\./g) || []).length

    return {
      success: true,
      pgn: cleanedText,
      movesFound: moveCount,
    }
  } catch (error) {
    console.error("Gemini API error:", error)
    return {
      success: false,
      error: `AI vision processing failed: ${error}`,
    }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function normalizeCastling(text: string): string {
  let normalized = text
    .replace(/0\s*-\s*0\s*-\s*0/g, 'O-O-O')
    .replace(/0\s*-\s*0/g, 'O-O')
    .replace(/[oО]\s*-\s*[oО]\s*-\s*[oО]/gi, 'O-O-O')
    .replace(/[oО]\s*-\s*[oО]/gi, 'O-O')
  
  normalized = normalized.replace(/\bO\s*-\s*O\s*-\s*O\b/g, 'O-O-O')
  normalized = normalized.replace(/\bO\s*-\s*O\b/g, 'O-O')
  
  return normalized
}

function extractChessMoves(text: string): string {
  let normalizedText = normalizeCastling(text)
    .replace(/\s+/g, ' ')
    .trim()
  
  const sequentialPattern = /(\d+)\.\s*([^\s\d]+)(?:\s+([^\s\d]+))?/g
  const moves: Array<{ white?: string; black?: string }> = []
  let match
  
  while ((match = sequentialPattern.exec(normalizedText)) !== null) {
    const moveNum = parseInt(match[1])
    const whiteMove = match[2]
    const blackMove = match[3]
    
    if (isValidMove(whiteMove)) {
      const entry = moves[moveNum - 1] || {}
      entry.white = cleanMove(whiteMove)
      moves[moveNum - 1] = entry
      
      if (blackMove && isValidMove(blackMove)) {
        entry.black = cleanMove(blackMove)
      }
    }
  }
  
  if (moves.length > 0) {
    let pgnText = ""
    moves.forEach((move, index) => {
      if (move.white || move.black) {
        pgnText += `${index + 1}. `
        if (move.white) {
          pgnText += `${move.white} `
        }
        if (move.black) {
          pgnText += `${move.black} `
        }
      }
    })
    return pgnText.trim()
  }
  
  const singleMovePattern = /[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O/g
  const allMoves = normalizedText.match(singleMovePattern)
  
  if (allMoves && allMoves.length >= 2) {
    let pgnText = ""
    let moveNumber = 1
    
    for (let i = 0; i < allMoves.length; i += 2) {
      const white = cleanMove(allMoves[i])
      const black = allMoves[i + 1] ? cleanMove(allMoves[i + 1]) : ""
      
      if (isValidMove(white)) {
        pgnText += `${moveNumber}. ${white} `
        if (black && isValidMove(black)) {
          pgnText += `${black} `
        }
        moveNumber++
      }
    }
    
    return pgnText.trim()
  }
  
  return ""
}

function isValidMove(move: string): boolean {
  if (!move || move.length < 2) return false
  
  const cleanedMove = move.replace(/[+#?!]/g, '').trim()
  const normalizedMove = normalizeCastling(cleanedMove)
  
  if (/^(O-O-O|O-O)$/i.test(normalizedMove)) {
    return true
  }
  
  if (!/[a-h][1-8]/.test(normalizedMove)) {
    return false
  }
  
  const validPattern = /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?$/i
  return validPattern.test(normalizedMove)
}

function cleanMove(move: string): string {
  let cleaned = move.trim()
  
  cleaned = normalizeCastling(cleaned)
  
  if (/^(O-O-O|O-O)$/i.test(cleaned)) {
    return cleaned.toUpperCase()
  }
  
  return cleaned
}

function validatePgn(pgn: string): boolean {
  try {
    const testGame = new Chess()
    testGame.loadPgn(pgn)
    return testGame.history().length > 0
  } catch {
    return false
  }
}

function validatePgnWithDetails(pgn: string): { valid: boolean; failedAt?: string; partialPgn?: string; moveCount: number } {
  const normalizeCastlingInText = (text: string): string => {
    return text
      .replace(/0\s*-\s*0\s*-\s*0/g, 'O-O-O')
      .replace(/0\s*-\s*0/g, 'O-O')
      .replace(/[oО]\s*-\s*[oО]\s*-\s*[oО]/gi, 'O-O-O')
      .replace(/[oО]\s*-\s*[oО]/gi, 'O-O')
      .replace(/\bO\s+-\s+O\s+-\s+O\b/g, 'O-O-O')
      .replace(/\bO\s+-\s+O\b/g, 'O-O')
  }
  
  try {
    const testGame = new Chess()
    const cleanedPgn = normalizeCastlingInText(pgn)
    
    testGame.loadPgn(cleanedPgn)
    const moveCount = Math.ceil(testGame.history().length / 2)
    return { valid: true, moveCount }
  } catch (error) {
    const testGame = new Chess()
    let partialMoves: string[] = []
    let failedAtMove = ""
    let currentMoveNumber = 1
    
    const cleanedPgn = normalizeCastlingInText(pgn)
    const moves = cleanedPgn.split(/\s+/)
    
    for (let i = 0; i < moves.length; i++) {
      const token = moves[i].trim()
      if (!token) continue
      
      if (/^\d+\.$/.test(token)) {
        currentMoveNumber = parseInt(token)
        continue
      }
      
      let cleanToken = token.replace(/\d+\./g, '').trim()
      if (!cleanToken) continue
      
      cleanToken = normalizeCastlingInText(cleanToken)
      
      try {
        const attemptedMove = testGame.move(cleanToken)
        
        if (!attemptedMove) {
          throw new Error(`Illegal move`)
        }
        
        partialMoves.push(cleanToken)
      } catch (moveError) {
        failedAtMove = `${token} (move ${currentMoveNumber})`
        console.error(`Failed to validate move "${token}" (cleaned: "${cleanToken}") at move ${currentMoveNumber}`)
        console.error("Legal moves were:", testGame.moves())
        console.error("Error:", moveError)
        break
      }
    }
    
    if (partialMoves.length > 0) {
      let reconstructedPgn = ""
      for (let i = 0; i < partialMoves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1
        reconstructedPgn += `${moveNum}. ${partialMoves[i]}`
        if (partialMoves[i + 1]) {
          reconstructedPgn += ` ${partialMoves[i + 1]}`
        }
        reconstructedPgn += " "
      }
      
      return {
        valid: false,
        failedAt: failedAtMove || "end of game",
        partialPgn: reconstructedPgn.trim(),
        moveCount: Math.ceil(partialMoves.length / 2),
      }
    }
    
    return { valid: false, failedAt: failedAtMove || "start", moveCount: 0 }
  }
}
