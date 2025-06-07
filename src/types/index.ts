// AI Models supported by the application
export type AIModel = string;

// Game modes - hierarchical structure
export type GameMode = 'ai-vs-ai-simple' | 'ai-vs-ai-complex' | 'human-vs-ai-simple' | 'human-vs-ai-complex';

// Player types
export type PlayerType = 'ai' | 'human';

// Game state interface
export interface GameState {
  fen: string;           // FEN string representation of the board
  pgn: string;           // PGN notation of the game
  turn: 'w' | 'b';       // Current turn (w for white, b for black)
  history: Move[];       // Array of moves made
  gameOver: boolean;     // Is the game over
  checkmate: boolean;    // Is the game in checkmate
  draw: boolean;         // Is the game a draw
  inCheck: boolean;      // Is the current player in check
  winner: 'white' | 'black' | null; // Who won the game (null if not over or draw)
}

// Chess move interface
export interface Move {
  from: string;          // Starting square (e.g., "e2")
  to: string;            // Target square (e.g., "e4")
  promotion?: string;    // Piece to promote to, if applicable
  piece: string;         // The piece that was moved
  color: 'w' | 'b';      // Color of the piece (w for white, b for black)
  san: string;           // Standard Algebraic Notation of the move
  timestamp: number;     // When the move was made
}

// Player configuration
export interface PlayerConfig {
  color: 'white' | 'black';
  type: PlayerType;
  model?: AIModel; // Optional for human players
}

// AI Function Call Response
export interface AIFunctionCallResponse {
  from: string;
  to: string;
  promotion?: string;
}

// Game configuration
export interface GameConfig {
  mode: GameMode;
  whitePlayer: PlayerConfig;
  blackPlayer: PlayerConfig;
} 