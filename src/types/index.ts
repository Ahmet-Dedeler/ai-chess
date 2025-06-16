/**
 * Type Definitions for AI Chess Battle Application
 * 
 * This file contains all TypeScript type definitions, interfaces, and type aliases
 * used throughout the chess application. These types ensure type safety and
 * provide clear contracts between different parts of the application.
 */

// AI Models supported by the application
// Currently using string type to allow dynamic model names from OpenAI API
export type AIModel = string;

// Game modes - hierarchical structure defining different gameplay experiences
// Simple modes: Basic AI vs AI or Human vs AI with minimal analysis
// Complex modes: Advanced AI with strategic memory, vision analysis, and detailed reasoning
export type GameMode = 'ai-vs-ai-simple' | 'ai-vs-ai-complex' | 'human-vs-ai-simple' | 'human-vs-ai-complex';

// Player types - defines whether a player is controlled by AI or human
export type PlayerType = 'ai' | 'human';

/**
 * Game State Interface
 * Represents the complete state of a chess game at any point in time
 */
export interface GameState {
  fen: string;           // FEN (Forsyth-Edwards Notation) string representation of the board position
  pgn: string;           // PGN (Portable Game Notation) of the complete game
  turn: 'w' | 'b';       // Current turn indicator (w for white, b for black)
  history: Move[];       // Chronological array of all moves made in the game
  gameOver: boolean;     // Flag indicating if the game has ended
  checkmate: boolean;    // Flag indicating if the game ended in checkmate
  draw: boolean;         // Flag indicating if the game ended in a draw
  inCheck: boolean;      // Flag indicating if the current player is in check
  winner: 'white' | 'black' | null; // Winner of the game (null if ongoing or draw)
}

/**
 * Chess Move Interface
 * Represents a single chess move with all relevant metadata
 */
export interface Move {
  from: string;          // Starting square in algebraic notation (e.g., "e2")
  to: string;            // Target square in algebraic notation (e.g., "e4")
  promotion?: string;    // Piece to promote to if move is a pawn promotion (e.g., "q")
  piece: string;         // The piece that was moved (e.g., "p" for pawn, "k" for king)
  color: 'w' | 'b';      // Color of the piece that moved (w for white, b for black)
  san: string;           // Standard Algebraic Notation of the move (e.g., "Nf3", "O-O")
  timestamp: number;     // Unix timestamp when the move was made
}

/**
 * Player Configuration Interface
 * Defines the setup for a single player (white or black)
 */
export interface PlayerConfig {
  color: 'white' | 'black';  // Which side the player controls
  type: PlayerType;          // Whether controlled by AI or human
  model?: AIModel;           // AI model to use (only required for AI players)
}

/**
 * AI Function Call Response Interface
 * Standardized format for AI move responses from OpenAI function calls
 */
export interface AIFunctionCallResponse {
  from: string;        // Starting square for the move
  to: string;          // Target square for the move
  promotion?: string;  // Optional promotion piece for pawn promotions
}

/**
 * Game Configuration Interface
 * Complete configuration for setting up a chess game
 */
export interface GameConfig {
  mode: GameMode;              // Type of game to play
  whitePlayer: PlayerConfig;   // Configuration for white player
  blackPlayer: PlayerConfig;   // Configuration for black player
}