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

function formatHistoryAsPgn(history: string[]): string {
  if (!history.length) {
    return ""
  }

  const segments: string[] = []
  for (let i = 0; i < history.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1
    const whiteMove = history[i]
    const blackMove = history[i + 1]

    if (!whiteMove && !blackMove) continue

    let fragment = `${moveNumber}. ${whiteMove ?? ""}`.trimEnd()
    if (blackMove) {
      fragment += ` ${blackMove}`
    }
    segments.push(fragment)
  }

  return segments.join(" ").trim()
}

function cleanPgnInput(input: string): string {
  if (!input) return ""

  return input
    .replace(/```pgn\s*/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "\n")
    .trim()
}

export async function parsePgnTextInput(rawInput: string): Promise<ParseResult> {
  const cleanedInput = cleanPgnInput(rawInput)

  if (!cleanedInput) {
    return {
      success: false,
      error: "Please paste a valid PGN string.",
    }
  }

  const normalizedInput = normalizeCastling(cleanedInput)
  const candidates = [normalizedInput]
  const stripped = stripPgnMetadata(normalizedInput)
  if (stripped && stripped !== normalizedInput) {
    candidates.push(stripped)
  }

  for (const candidate of candidates) {
    try {
      const chess = new Chess()
      chess.loadPgn(candidate)
      const history = chess.history()

      if (history.length > 0) {
        return {
          success: true,
          pgn: formatHistoryAsPgn(history),
          movesFound: Math.ceil(history.length / 2),
        }
      }
    } catch {
      // fall through to validation flow
    }
  }

  const validationResult = validatePgnWithDetails(stripped || normalizedInput)

  if (validationResult.valid) {
    return {
      success: true,
      pgn: stripped || normalizedInput,
      movesFound: validationResult.moveCount,
    }
  }

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
    error: validationResult.failedAt
      ? `Unable to parse PGN. Problem detected near ${validationResult.failedAt}.`
      : "Unable to parse PGN. Please verify the notation and try again.",
  }
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
    
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
    if (!API_KEY) {
      throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.")
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
    
    const promptText = `You are an expert chess analyst and handwriting recognition specialist. Your task is to carefully extract chess moves from this handwritten scoresheet image.

📋 SCORESHEET STRUCTURE:
- Two columns: WHITE moves (LEFT) and BLACK moves (RIGHT)
- Each row = one complete move pair (White's move + Black's move)
- Move numbers are in the leftmost column
- Read row by row: move number → White's move → Black's move

🔍 STEP-BY-STEP EXTRACTION PROCESS:

STEP 1 - READ EACH MOVE CAREFULLY:
For each row, identify:
- Move number (1, 2, 3, etc.)
- White's move in LEFT column
- Black's move in RIGHT column

STEP 2 - INTERPRET HANDWRITING:
Common OCR/handwriting confusions - BE VERY CAREFUL:
- Letter "g" vs "a" or "q" (e.g., Ng5 vs Na5)
- Letter "O" vs number "0" (castling must use letter O: O-O)
- "N" vs "K" (N=knight, K=king)
- "b" vs "h" or "6"
- "c" vs "e"
- "d" vs "cl" or "a"
- "1" vs "l" (lowercase L)
- "5" vs "S"
- Faint "x" for captures
- Unclear "+" or "#" for check/checkmate

STEP 3 - VALIDATE EACH MOVE:
As you extract moves, mentally play them on the board:
- Does this move make sense given the current position?
- Is the piece able to reach that square?
- Does the notation match what's possible in this position?
- If a move seems illegal, re-examine the handwriting - what else could it be?

STEP 4 - COMMON PATTERNS TO RECOGNIZE:
- Opening moves: e4, d4, Nf3, Nc3, Bc4, Bb5, etc.
- Pawn captures: exd5, cxd4, etc.
- Piece moves with captures: Nxd5, Bxc6+, Qxd5
- Castling: O-O (kingside) or O-O-O (queenside) - written as 0-0 or 0-0-0
- Checks: move followed by "+"
- Checkmate: move followed by "#"

STEP 5 - SELF-VALIDATION:
After extracting all moves, review the complete game:
1. Start from position: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
2. Play through each move mentally
3. If any move is impossible, re-check that move's handwriting
4. Look for common misreadings (a↔g, b↔h, c↔e, N↔K, O↔0)
5. Ensure moves alternate White-Black correctly
6. Verify move numbers are sequential

⚠️ CRITICAL RULES:
1. Castling MUST be: O-O or O-O-O (capital letter O, NOT zero)
2. Knight moves use "N" (not K or Kn)
3. Pawn moves have no piece letter (just "e4", not "Pe4")
4. Captures use "x": Nxd5, exd5
5. Each move must be LEGAL in the sequence

📤 OUTPUT FORMAT:
Return ONLY the PGN moves in this format:
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7

Rules for output:
- NO markdown formatting or code blocks
- NO explanations or commentary
- NO line breaks between moves
- Just move numbers, dots, and moves separated by spaces
- If no chess notation found, return: NO_NOTATION_FOUND

🎯 QUALITY CHECK:
Before returning your answer:
✓ Did you check each ambiguous letter carefully?
✓ Did you mentally validate that all moves are legal?
✓ Did you convert all castling to O-O format (letter O)?
✓ Are move numbers sequential?
✓ Did you include ALL moves from the scoresheet?

Now carefully extract the moves from this scoresheet image:`

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

    // If Gemini returned properly formatted PGN (starts with "1."), use it directly
    let cleanedText = geminiResponse
    if (!/^1\.\s+/.test(cleanedText)) {
      // Otherwise, try to extract moves from unformatted text
      cleanedText = extractChessMoves(geminiResponse)
    }
    
    console.log("=== CHESS NOTATION EXTRACTION DEBUG ===")
    console.log("Gemini raw response:", geminiResponse)
    console.log("After extractChessMoves:", cleanedText)
    console.log("======================================")
    
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

function stripPgnMetadata(text: string): string {
  if (!text) return ""

  let sanitized = text

  // Remove PGN header tags
  sanitized = sanitized.replace(/\[[^\]]*\]/g, " ")
  // Remove braces comments
  sanitized = sanitized.replace(/\{[^}]*\}/g, " ")
  // Remove semicolon comments
  sanitized = sanitized.replace(/;[^\n]*/g, " ")
  // Remove recursive parentheses variations
  let previous = sanitized
  do {
    previous = sanitized
    sanitized = sanitized.replace(/\([^()]*\)/g, " ")
  } while (sanitized !== previous)

  return sanitized.replace(/\s+/g, " ").trim()
}

function normalizeCastling(text: string): string {
  let normalized = text
    // Handle zeros (0) -> letter O
    .replace(/0\s*-\s*0\s*-\s*0/g, 'O-O-O')
    .replace(/0\s*-\s*0/g, 'O-O')
    // Handle lowercase o or Cyrillic О -> letter O
    .replace(/[oО]\s*-\s*[oО]\s*-\s*[oО]/gi, 'O-O-O')
    .replace(/[oО]\s*-\s*[oО]/gi, 'O-O')
    // Handle spaced O-O variations
    .replace(/\bO\s*-\s*O\s*-\s*O\b/g, 'O-O-O')
    .replace(/\bO\s*-\s*O\b/g, 'O-O')
  
  // Handle common OCR mistakes in castling
  normalized = normalized
    .replace(/\b00\b/g, 'O-O')           // Handles 00 without hyphens
    .replace(/\b000\b/g, 'O-O-O')        // Handles 000 without hyphens
    .replace(/\b0-0\b/g, 'O-O')          // Handles 0-0
    .replace(/\b0-0-0\b/g, 'O-O-O')      // Handles 0-0-0
  
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

function tryOcrCorrections(move: string, chess: Chess): string | null {
  // First, try disambiguation for ambiguous piece moves (Rd1 → Rcd1, Rfd1, etc.)
  if (/^[RNBQK][a-h]?[1-8]$/.test(move)) {
    const piece = move[0]
    const destination = move.slice(-2)
    const legalMoves = chess.moves()
    
    // Try adding file disambiguation (Ra1 → Raa1, Rba1, Rca1, etc.)
    for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const disambiguated = `${piece}${file}${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
    
    // Try adding rank disambiguation (Ra1 → R1a1, R2a1, etc.)
    for (const rank of ['1', '2', '3', '4', '5', '6', '7', '8']) {
      const disambiguated = `${piece}${rank}${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
  }
  
  // Try disambiguation for captures (Rxd1 → Rcxd1, Rfxd1, etc.)
  if (/^[RNBQK]x[a-h][1-8]$/.test(move)) {
    const piece = move[0]
    const destination = move.slice(-2)
    const legalMoves = chess.moves()
    
    for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const disambiguated = `${piece}${file}x${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
    
    for (const rank of ['1', '2', '3', '4', '5', '6', '7', '8']) {
      const disambiguated = `${piece}${rank}x${destination}`
      if (legalMoves.includes(disambiguated)) {
        return disambiguated
      }
    }
  }
  
  // Common OCR mistakes in handwritten chess notation
  const corrections = [
    // Number confusions in square names
    { pattern: /([a-h])6/g, replacement: '$15' },  // d6 → d5
    { pattern: /([a-h])5/g, replacement: '$16' },  // d5 → d6
    { pattern: /([a-h])3/g, replacement: '$14' },  // d3 → d4
    { pattern: /([a-h])4/g, replacement: '$13' },  // d4 → d3
    { pattern: /([a-h])2/g, replacement: '$13' },  // d2 → d3
    { pattern: /([a-h])7/g, replacement: '$18' },  // d7 → d8
    { pattern: /([a-h])8/g, replacement: '$17' },  // d8 → d7
    
    // Letter confusions: a↔g, e↔c, b↔h, l↔1
    { pattern: /Na(\d)/, replacement: 'Ng$1' },  // Na5 → Ng5
    { pattern: /Ng(\d)/, replacement: 'Na$1' },  // Ng5 → Na5
    { pattern: /Ba(\d)/, replacement: 'Bg$1' },  // Ba5 → Bg5
    { pattern: /Bg(\d)/, replacement: 'Ba$1' },  // Bg5 → Ba5
    { pattern: /Ra(\d)/, replacement: 'Rg$1' },  // Ra5 → Rg5
    { pattern: /Rg(\d)/, replacement: 'Ra$1' },  // Rg5 → Ra5
    { pattern: /Qa(\d)/, replacement: 'Qg$1' },  // Qa5 → Qg5
    { pattern: /Qg(\d)/, replacement: 'Qa$1' },  // Qg5 → Qa5
    { pattern: /a([1-8])/, replacement: 'g$1' }, // a5 → g5 (pawn moves)
    { pattern: /g([1-8])/, replacement: 'a$1' }, // g5 → a5 (pawn moves)
    { pattern: /b([1-8])/, replacement: 'h$1' }, // b5 → h5
    { pattern: /h([1-8])/, replacement: 'b$1' }, // h5 → b5
    { pattern: /c([1-8])/, replacement: 'e$1' }, // c5 → e5
    { pattern: /e([1-8])/, replacement: 'c$1' }, // e5 → c5
    { pattern: /d([1-8])/, replacement: 'a$1' }, // d5 → a5
    { pattern: /l/, replacement: '1' },          // l → 1
    { pattern: /1/, replacement: 'l' },          // 1 → l (rare)
  ]

  for (const { pattern, replacement } of corrections) {
    const corrected = move.replace(pattern, replacement)
    if (corrected !== move) {
      try {
        // Create a temporary chess instance to test the move
        const testChess = new Chess(chess.fen())
        const testMove = testChess.move(corrected)
        if (testMove) {
          return corrected
        }
      } catch {
        // Try next correction
      }
    }
  }

  return null
}

function validatePgnWithDetails(pgn: string): { valid: boolean; failedAt?: string; partialPgn?: string; moveCount: number } {
  const normalized = normalizeCastling(pgn)
  const cleanedPgn = stripPgnMetadata(normalized)

  try {
    const testGame = new Chess()
    testGame.loadPgn(cleanedPgn)
    const moveCount = Math.ceil(testGame.history().length / 2)
    if (moveCount === 0) {
      throw new Error("No moves parsed")
    }
    return { valid: true, moveCount }
  } catch (error) {
    const testGame = new Chess()
    let partialMoves: string[] = []
    let failedAtMove = ""
    let currentMoveNumber = 1
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
      
      // Apply castling normalization to each individual token
      cleanToken = normalizeCastling(cleanToken)
      
      try {
        let attemptedMove = testGame.move(cleanToken)
        
        if (!attemptedMove) {
          throw new Error(`Illegal move`)
        }
        
        partialMoves.push(cleanToken)
      } catch (moveError) {
        // Try common OCR misreadings before giving up
        const correctedMove = tryOcrCorrections(cleanToken, testGame)
        
        if (correctedMove) {
          console.log(`Auto-corrected "${cleanToken}" to "${correctedMove}"`)
          partialMoves.push(correctedMove)
          testGame.move(correctedMove)
          continue
        }
        
        failedAtMove = `${token} (move ${currentMoveNumber})`
        console.error(`=== MOVE VALIDATION FAILED ===`)
        console.error(`Original token: "${token}"`)
        console.error(`Cleaned token: "${cleanToken}"`)
        console.error(`Move number: ${currentMoveNumber}`)
        console.error(`Current position FEN: ${testGame.fen()}`)
        console.error(`Legal moves available:`, testGame.moves())
        console.error(`Error:`, moveError)
        console.error(`Successful moves so far:`, partialMoves)
        console.error(`==============================`)
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
