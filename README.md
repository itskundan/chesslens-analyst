# ChessLens Analyst

A corporate-grade chess analysis tool built with React, TypeScript, and Tailwind CSS. Analyze games from multiple sources including CSV files, images with OCR, and manual play.

## Features

### Phase 1: Professional UI Shell ✓
- Clean, corporate "MNC-style" interface
- Responsive grid layout with sidebar
- High-contrast design with ample whitespace

### Phase 2: Core Chess Integration ✓
- Full chess game engine powered by chess.js
- Interactive drag-and-drop board using react-chessboard
- Legal move validation
- Real-time move history tracking

### Phase 3: Multi-Format Parsing ✓
- **CSV Upload**: Parse games from CSV files with "White" and "Black" columns
- **Image OCR**: Extract chess notation from PNG/JPG images using Tesseract.js
- Robust error handling with clear user feedback

### Phase 4: Game Replay & Navigation ✓
- First/Previous/Next/Last move controls
- Auto-play mode with configurable timing
- Click any move in the history to jump to that position
- Synchronized board and move list highlighting

### Phase 5: Interactive Analysis Mode ✓
- Fork game state at any position for "what-if" analysis
- Visual indicator (blue border) when in analysis mode
- "Return to Main Game" button to restore original line
- Preserves main game history while exploring variations

## Usage

### Manual Play
Simply drag and drop pieces on the board to play a game manually. Illegal moves are rejected with instant feedback.

### Upload CSV
Create a CSV file with the following format:
```csv
White,Black
e4,e5
Nf3,Nc6
Bc4,Nf6
```

Then click "Upload" and select your CSV file.

### Upload Image
Take a screenshot or photo of a chess scoresheet containing standard algebraic notation. The OCR engine will extract the moves automatically.

### Navigation
- **First** (⏮): Jump to starting position
- **Previous** (◀): Go back one move
- **Play/Pause** (▶/⏸): Auto-play through the game
- **Next** (▶): Advance one move
- **Last** (⏭): Jump to final position

### Analysis Mode
1. Load or play a game
2. Navigate to any position
3. Make a different move by dragging a piece
4. The board border turns blue to indicate analysis mode
5. Continue exploring the variation
6. Click "Return to Main Game" to restore the original line

## Sample Games Included

The app includes three famous games for demonstration:
1. **Anderssen vs Kieseritzky (1851)** - The Immortal Game
2. **Deep Blue vs Kasparov (1997)** - Historic computer chess
3. **Fischer vs Benko (1963)** - Brilliant tactical play

## Tech Stack

- **React 19** with TypeScript
- **chess.js** - Chess game logic
- **react-chessboard** - Visual board component
- **tesseract.js** - OCR for image processing
- **papaparse** - CSV parsing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Phosphor Icons** - Icon system
- **Sonner** - Toast notifications

## Design Philosophy

ChessLens follows an "Enterprise Minimalist" design approach:
- Professional typography using system fonts
- High-contrast color scheme for optimal readability
- Subtle animations (200-300ms) that serve functional purposes
- Consistent spacing and grid-based layout
- Corporate-appropriate aesthetic suitable for business environments

## Error Handling

The application includes comprehensive error handling:
- Invalid file formats are rejected with clear messages
- Partial OCR results warn users of incomplete extraction
- Illegal moves provide immediate visual feedback
- Empty uploads are prevented
- Large files show progress indicators
