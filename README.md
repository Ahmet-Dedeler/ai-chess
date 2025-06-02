# AI Chess Battle

A modern chess application featuring AI vs AI battles, human vs AI gameplay, and advanced position analysis using React and TypeScript.

## ✨ Features

### 🎨 Modern UI Design
- **Clean, centered layout** - Chessboard prominently displayed at center
- **Compact control panel** - Streamlined game mode selection with icons
- **Popular model selection** - Quick access to gpt-4o, gpt-4.1, o3, o4-mini
- **Visual evaluation bar** - Real-time position assessment (left side of board)
- **Interactive board** - Click/right-click highlighting, drag-and-drop moves
- **Compact move history** - Space-efficient move tracking with visual chips

### 🎯 Game Modes
- **Simple Mode** - Quick AI vs AI battles with streamlined interface
- **Human vs AI** - Play against powerful AI models
- **Complex Mode** - Full strategic analysis with AI reasoning and memory

### 🤖 AI Features
- **Multiple AI Models** - Support for OpenAI's latest models including o-series
- **Strategic Memory** - AI players remember openings, goals, and analysis
- **Move Analysis** - Detailed reasoning for each move
- **Position Evaluation** - Visual evaluation bar showing position advantage

### 🎮 Interactive Features
- **Square Highlighting** - Click squares to highlight, right-click for different colors
- **Arrow Drawing** - Right-click and drag to draw arrows (like Chess.com/Lichess)
- **Promotion Dialog** - Visual piece selection for pawn promotion
- **Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd ai-chess-battle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the application**
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## 🎯 How to Use

### Getting Started
1. **Select Game Mode** - Choose Simple, Human vs AI, or Complex
2. **Configure Players** - Select AI models or set human player color
3. **Start Game** - Click the green Start button
4. **Watch or Play** - Enjoy AI battles or play against the computer

### Game Modes Explained

#### Simple Mode
- Fast AI vs AI gameplay
- Basic move analysis
- Streamlined interface
- Perfect for quick demonstrations

#### Human vs AI
- Play as white or black against AI
- Choose your opponent's AI model
- Real-time position evaluation
- Interactive piece movement

#### Complex Mode
- Full AI strategic analysis
- Memory-based decision making
- Detailed position evaluations
- Strategy panels showing AI reasoning

### Features Guide

#### Evaluation Bar
- **Real Stockfish Analysis** - Position evaluated by Stockfish 16
- **Color Coding** - Green for white advantage, red for black
- **Mate Detection** - Shows "M5" for mate in 5, etc.
- **Depth Display** - Shows analysis depth below evaluation

#### Interactive Board
- **Right-click Highlighting** - Cycle through yellow → red → green → clear
- **Drag & Drop** - Move pieces naturally (human vs AI mode)
- **Visual Feedback** - Move highlights and position indicators

#### Move History
- **Compact Display** - Space-efficient move list
- **Color Coding** - White and black move chips
- **Scrollable** - Handles long games gracefully

## 🛠️ Technical Features

### Modern React Architecture
- **TypeScript** for type safety
- **Material-UI v5** for modern components
- **Custom hooks** for game state management
- **Service-based architecture** for AI and chess logic

### Chess Engine Integration
- **Chess.js** for game logic and validation
- **React-Chessboard** for interactive board display
- **FEN/PGN support** for position import/export
- **Move validation** and legal move generation

### AI Integration
- **OpenAI API** integration with latest models
- **Function calling** for precise move generation
- **Context-aware prompting** with position analysis
- **Memory systems** for strategic planning
- **Error handling** and retry logic

## 🎨 Design Principles

### User Experience
- **Board-centric design** - Chess board is the main focus
- **Minimal cognitive load** - Important information is easily accessible
- **Progressive disclosure** - Advanced features shown when needed
- **Familiar interactions** - Based on popular chess sites

### Visual Design
- **Clean typography** - Inter font family for readability
- **Subtle shadows** - Material Design elevation principles
- **Consistent spacing** - 8px grid system
- **Accessible colors** - High contrast for evaluation indicators

### Responsive Layout
- **Mobile-first** - Works on all screen sizes
- **Flexible grid** - Adapts to available space
- **Touch-friendly** - Large tap targets for mobile

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Chessboard.tsx          # Interactive chess board
│   ├── EvaluationBar.tsx       # Stockfish evaluation display
│   ├── ModernControlPanel.tsx  # Game controls and settings
│   └── CompactMoveHistory.tsx  # Move history display
├── services/           # Business logic and API services
│   ├── aiService.ts           # AI move generation
│   ├── chessService.ts        # Chess game logic
│   ├── stockfishService.ts    # Stockfish evaluation
│   └── memoryService.ts       # AI memory system
└── types.ts           # TypeScript type definitions
```

### Key Components

#### StockfishService
- Manages Stockfish WASM worker
- Handles UCI protocol communication
- Provides real-time position evaluation
- Includes timeout and error handling

#### EvaluationBar
- Displays Stockfish evaluation visually
- Matches chessboard height exactly
- Shows centipawn evaluation and mate scores
- Updates in real-time as position changes

#### ModernControlPanel
- Streamlined game configuration
- Popular AI model quick-selection
- Icon-based game mode switching
- Responsive layout for all screen sizes

### Environment Variables
- `REACT_APP_OPENAI_API_KEY` - Your OpenAI API key

### Building for Production
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- **Stockfish Integration** - Real chess engine evaluation
- **Game Database** - Save and replay games
- **Tournament Mode** - Multi-game competitions
- **Analysis Board** - Deep position analysis
- **Custom Openings** - Opening book integration
- **Sound Effects** - Audio feedback for moves
- **Themes** - Multiple board and piece themes

---

Enjoy playing chess with AI! 🏆 