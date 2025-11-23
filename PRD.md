# ChessLens Analyst - Product Requirements Document

A professional chess analysis platform designed for serious players, coaches, and analysts who need to review, analyze, and learn from chess games with enterprise-grade reliability and clarity.

**Experience Qualities**:
1. **Professional** - Corporate-grade interface that communicates seriousness and reliability, suitable for business and educational environments
2. **Precise** - Every interaction provides clear, immediate feedback with no ambiguity about the current game state or available actions
3. **Efficient** - Streamlined workflows that minimize clicks and maximize focus on chess analysis rather than interface navigation

**Complexity Level**: Light Application (multiple features with basic state)
- Multiple interconnected features (upload, playback, analysis) with persistent game state, but focused on a single domain with clear user flows

## Essential Features

### 1. Chess Board Display & Manual Play
- **Functionality**: Interactive chess board with full drag-and-drop piece movement, legal move validation, and captured piece tracking
- **Purpose**: Enables users to play through positions manually and verify their understanding before analyzing uploaded games
- **Trigger**: User lands on application or clicks "New Game"
- **Progression**: View empty board → Drag piece → Drop on valid square → Piece moves and move recorded → Continue play
- **Success Criteria**: User can complete a full legal chess game with instant feedback on illegal moves, seeing move history update in real-time

### 2. Multi-Format Game Upload & Parsing
- **Functionality**: Accepts CSV, PNG, JPG files containing chess notation and extracts PGN data using CSV parsing or OCR
- **Purpose**: Allows users to digitize games from various sources (screenshots, spreadsheets, scoresheet photos) for analysis
- **Trigger**: User clicks "Upload" button in navbar
- **Progression**: Click upload → Select file → File processes (with loading indicator) → Notation extracted → Game loaded on board → Success message
- **Success Criteria**: CSV with "White/Black" columns loads correctly; clear image of chess notation extracts at least 80% of moves accurately; appropriate error messages for unclear images

### 3. Game Replay Navigation
- **Functionality**: Step-by-step navigation through uploaded games with synchronized board updates and move highlighting
- **Purpose**: Enables systematic review of games to identify key moments, mistakes, and learning opportunities
- **Trigger**: Game is loaded from upload or manual play
- **Progression**: Game loaded → Click "Next" → Board animates to next position → Move highlighted in list → Repeat or jump to specific move → Reach end of game
- **Success Criteria**: All navigation controls (First/Previous/Next/Last) work instantly; move list synchronizes perfectly with board state; clicking any move in the list jumps directly to that position

### 4. Analysis Mode (Branching)
- **Functionality**: Fork game state at any position to explore alternative variations without losing the main game line
- **Purpose**: Supports "what-if" analysis, allowing users to test different moves and evaluate alternatives to what was played
- **Trigger**: User drags a piece while reviewing a position from an uploaded game
- **Progression**: Navigate to move 15 → Drag different piece → Board border changes color (blue) → Play continues on new branch → Click "Return to Main Game" → Original game restored
- **Success Criteria**: Analysis branch maintains separate state; visual indicator (border color change) clearly shows analysis mode is active; returning to main game preserves all original moves

### 5. Auto-Play Mode
- **Functionality**: Automatically advances through moves at a configurable pace with play/pause control
- **Purpose**: Provides a hands-free way to review games, useful for presentations or casual review
- **Trigger**: User clicks "Auto-Play" button
- **Progression**: Click "Auto-Play" → Moves advance every 2 seconds → User can pause at any time → Resume or stop
- **Success Criteria**: Smooth, consistent timing between moves; pause/resume works immediately; stops cleanly at game end

## Edge Case Handling

- **Invalid File Upload**: Display clear error message specifying what went wrong (format not supported, file corrupted, no chess notation detected)
- **Partial OCR Extraction**: Show warning with number of moves successfully parsed, allow user to proceed with partial game
- **Illegal Move Attempt**: Piece snaps back to original position with subtle red border flash on board
- **Empty Upload**: Prevent processing and show "File appears empty" message
- **Large Game Files**: Show loading progress indicator for files taking >1 second to process
- **Analysis Mode Memory**: Preserve analysis branches in session storage to prevent accidental loss on navigation

## Design Direction

The design should evoke the feeling of enterprise software—reliable, professional, and meticulously organized, similar to Bloomberg Terminal's information density with the clarity of Notion's interface. A minimal interface serves the analytical purpose best, avoiding distractions and keeping the user's focus entirely on chess content. The aesthetic should feel equally at home in a corporate training room or a chess coach's office.

## Color Selection

**Triadic color scheme** adapted for professional environments—using cool grays as the foundation with strategic accent colors for status indication. This creates visual hierarchy while maintaining the subdued, business-appropriate atmosphere.

- **Primary Color**: Deep Charcoal `oklch(0.25 0.01 270)` - Conveys authority and seriousness, used for primary actions and key UI elements
- **Secondary Colors**: Cool Gray `oklch(0.96 0.005 270)` for backgrounds, Medium Gray `oklch(0.65 0.01 270)` for secondary text - Creates the layered, professional panel aesthetic
- **Accent Color**: Strategic Blue `oklch(0.55 0.15 250)` for analysis mode indicators and active states - Draws attention without being aggressive
- **Foreground/Background Pairings**:
  - Background (White `oklch(1 0 0)`): Charcoal text `oklch(0.25 0.01 270)` - Ratio 11.2:1 ✓
  - Card (Light Gray `oklch(0.98 0.005 270)`): Dark Gray text `oklch(0.30 0.01 270)` - Ratio 10.1:1 ✓
  - Primary (Charcoal `oklch(0.25 0.01 270)`): White text `oklch(1 0 0)` - Ratio 11.2:1 ✓
  - Secondary (Cool Gray `oklch(0.96 0.005 270)`): Charcoal text `oklch(0.25 0.01 270)` - Ratio 9.8:1 ✓
  - Accent (Strategic Blue `oklch(0.55 0.15 250)`): White text `oklch(1 0 0)` - Ratio 5.2:1 ✓
  - Muted (Light Gray `oklch(0.96 0.005 270)`): Medium Gray text `oklch(0.55 0.01 270)` - Ratio 5.8:1 ✓

## Font Selection

Typography should project competence and readability, using system fonts to ensure instant loading and native OS integration that feels familiar and professional.

- **Typographic Hierarchy**:
  - H1 (App Title): System Sans Bold / 24px / -0.02em letter spacing / 1.2 line height
  - H2 (Section Headers): System Sans Semibold / 18px / -0.01em letter spacing / 1.3 line height
  - Body (Move List, Labels): System Sans Regular / 16px / normal letter spacing / 1.5 line height
  - Small (Timestamps, Meta): System Sans Regular / 14px / normal letter spacing / 1.4 line height
  - Button Text: System Sans Medium / 15px / normal letter spacing / 1.0 line height

## Animations

Animations should be nearly invisible, existing only to maintain spatial continuity and acknowledge user actions—never to entertain or show off technical capability.

- **Purposeful Meaning**: Subtle 200ms transitions communicate state changes (button hover, mode switching) while piece movements on the board use 300ms easing to maintain chess's deliberate, thoughtful nature
- **Hierarchy of Movement**: Piece movements on the chessboard are the primary animation focus (300-400ms), while UI transitions (button states, panel reveals) are faster (150-200ms) to avoid competing for attention

## Component Selection

- **Components**: 
  - `Button` with size variants (sm for navigation, default for primary actions) - subtle shadow on hover for depth
  - `Card` for containing the chessboard and move list panels - custom border styling for analysis mode
  - `Input` with file upload styling for game import - drag-and-drop visual feedback
  - `Table` for move list display - custom row highlighting for current move
  - `Separator` for visual section division in sidebar
  - `Progress` for file upload processing indication
  - `Alert` for error messages and warnings

- **Customizations**:
  - Custom chessboard wrapper component with border state management (normal/analysis mode)
  - File upload dropzone with visual drag-over states
  - Move list table with click-to-navigate and current-move highlighting
  - Navigation control panel with icon-only buttons (using phosphor-icons)
  - Status indicator component for displaying current game state (playing/analysis/replay)

- **States**:
  - Buttons: Default (gray-100 bg), Hover (gray-200 bg), Active (gray-300 bg), Disabled (gray-50 bg, gray-300 text)
  - Board Border: Normal (gray-200), Analysis Mode (blue-500), Error Flash (red-400)
  - Move List Rows: Default (transparent), Hover (gray-50), Current Move (blue-50), Clickable cursor
  
- **Icon Selection**:
  - `SkipBack` (First move), `CaretLeft` (Previous), `CaretRight` (Next), `SkipForward` (Last move)
  - `Play` (Auto-play), `Pause` (Pause auto-play)
  - `UploadSimple` (File upload), `ArrowCounterClockwise` (Return to main game)
  - `Info` (Status messages), `Warning` (Error states)

- **Spacing**: Use Tailwind's spacing scale consistently - gap-4 between controls, gap-6 between major sections, p-6 for card padding, p-4 for button padding

- **Mobile**: 
  - Stack sidebar below chessboard on screens <768px
  - Board takes full width with 4:3 aspect ratio constraint
  - Move list scrolls horizontally on mobile with sticky headers
  - Navigation controls remain fixed at bottom of screen on mobile
  - Upload button moves to floating action button position on mobile
