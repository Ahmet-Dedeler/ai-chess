/**
 * Chess Service - Core Chess Game Logic
 * 
 * This service provides a wrapper around the chess.js library, offering
 * a clean interface for managing chess game state, validating moves,
 * and providing game information. It acts as the single source of truth
 * for the current chess position and game rules.
 * 
 * Key responsibilities:
 * - Managing the current chess position using chess.js
 * - Validating and executing moves
 * - Providing game state information (check, checkmate, draw, etc.)
 * - Converting between different move formats
 * - Maintaining move history
 */

import { Chess } from 'chess.js';
import { GameState, Move, AIFunctionCallResponse } from '../types';

class ChessService {
  // The core chess.js instance that handles all chess logic
  private chess: Chess;

  constructor() {
    // Initialize a new chess game in the starting position
    this.chess = new Chess();
  }

  /**
   * Get the current complete game state
   * @returns GameState object containing position, turn, history, and game status
   */
  getGameState(): GameState {
    const turn = this.chess.turn();
    const history = this.mapMoveHistory();
    const inCheck = this.chess.inCheck();
    const gameOver = this.chess.isGameOver();
    const checkmate = this.chess.isCheckmate();
    const draw = this.chess.isDraw();
    
    // Determine the winner if the game is over
    // In checkmate, the player whose turn it is has lost
    let winner: 'white' | 'black' | null = null;
    if (checkmate) {
      winner = turn === 'w' ? 'black' : 'white'; // If it's white's turn and checkmate, black won
    }

    return {
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      turn,
      history,
      gameOver,
      checkmate,
      draw,
      inCheck,
      winner
    };
  }

  /**
   * Reset the game to the initial starting position
   * This clears all move history and returns to the standard chess starting position
   */
  resetGame(): void {
    this.chess.reset();
  }

  /**
   * Attempt to make a move on the chess board
   * Validates the move against chess rules and executes it if legal
   * @param move - Move object containing from/to squares and optional promotion
   * @returns Move object if successful, null if invalid
   */
  makeMove(move: AIFunctionCallResponse): Move | null {
    try {
      console.log(`🎲 Chess Service: Attempting move ${move.from} -> ${move.to}${move.promotion ? ` (=${move.promotion})` : ''}`);
      
      // Log current position for debugging purposes
      console.log(`📍 Current FEN: ${this.chess.fen()}`);
      console.log(`📍 Current turn: ${this.chess.turn()}`);
      
      // Attempt to make the move using chess.js
      // This validates the move according to chess rules
      const result = this.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion
      });
      
      // If the move is valid, chess.js returns the move object
      if (result) {
        console.log(`✅ Move successful: ${result.san}`);
        // Convert chess.js move format to our Move interface
        return {
          from: result.from,
          to: result.to,
          promotion: result.promotion,
          piece: result.piece,
          color: result.color,
          san: result.san,
          timestamp: Date.now()
        };
      } else {
        console.error(`❌ Chess.js rejected the move`);
        return null;
      }
    } catch (error) {
      console.error(`💥 Chess Service: Move failed with error:`, error);
      console.error(`🔍 Failed move details:`, move);
      
      // Log available moves for debugging AI move generation issues
      const legalMoves = this.chess.moves({ verbose: true });
      console.log(`📋 Legal moves available: ${legalMoves.map(m => m.san).join(', ')}`);
      
      return null;
    }
  }

  /**
   * Get all legal moves in the current position
   * Returns moves in our standardized format for consistency across the application
   * @returns Array of Move objects representing all possible legal moves
   */
  getAllLegalMoves(): Move[] {
    // Get all possible moves in verbose format from chess.js
    const legalMoves = this.chess.moves({ verbose: true });
    
    // Convert chess.js move format to our standardized Move interface
    return legalMoves.map(move => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      piece: move.piece,
      color: move.color,
      san: move.san,
      timestamp: Date.now()
    }));
  }

  /**
   * Get valid moves organized by starting square
   * Useful for UI components that need to highlight possible moves from a selected piece
   * @returns Object mapping each square to an array of possible destination squares
   */
  getValidMoves(): { [square: string]: string[] } {
    const moves: { [square: string]: string[] } = {};
    
    // Get all possible moves from chess.js
    const possibleMoves = this.chess.moves({ verbose: true });
    
    // Group moves by their starting square for easier UI consumption
    possibleMoves.forEach(move => {
      if (!moves[move.from]) {
        moves[move.from] = [];
      }
      moves[move.from].push(move.to);
    });
    
    return moves;
  }

  /**
   * Get the current board position as a 2D array
   * Returns the raw board state for position analysis and AI evaluation
   * @returns 2D array representing the 8x8 chess board with piece objects
   */
  getBoardPosition() {
    return this.chess.board();
  }

  /**
   * Check if the current position is in check
   * @returns boolean indicating if the current player is in check
   */
  isInCheck(): boolean {
    return this.chess.inCheck();
  }

  /**
   * Check if the game has ended
   * @returns boolean indicating if the game is over (checkmate, stalemate, or draw)
   */
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Get the current FEN (Forsyth-Edwards Notation) string
   * FEN represents the complete game state in a compact string format
   * @returns string containing the current position in FEN notation
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get the current PGN (Portable Game Notation) string
   * PGN contains the complete move history in standard chess notation
   * @returns string containing the game moves in PGN format
   */
  getPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Convert chess.js internal move history to our standardized Move format
   * This method provides consistency across the application by using our Move interface
   * @returns Array of Move objects representing the complete game history
   * @private
   */
  private mapMoveHistory(): Move[] {
    // Get move history from chess.js in verbose format
    const history = this.chess.history({ verbose: true });
    
    // Convert to our Move interface, adding approximate timestamps
    return history.map((move, index) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      piece: move.piece,
      color: move.color,
      san: move.san,
      timestamp: Date.now() - (history.length - index) * 1000 // Approximate timestamp based on move order
    }));
  }
}

// Create and export a singleton instance for use throughout the application
// This ensures consistent game state across all components and services
export const chessService = new ChessService();