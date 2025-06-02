import { Chess } from 'chess.js';
import { GameState, Move, AIFunctionCallResponse } from '../types';

class ChessService {
  private chess: Chess;

  constructor() {
    // Initialize a new chess game
    this.chess = new Chess();
  }

  // Get the current game state
  getGameState(): GameState {
    const turn = this.chess.turn();
    const history = this.mapMoveHistory();
    const inCheck = this.chess.inCheck();
    const gameOver = this.chess.isGameOver();
    const checkmate = this.chess.isCheckmate();
    const draw = this.chess.isDraw();
    
    // Determine the winner if the game is over
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

  // Reset the game to the starting position
  resetGame(): void {
    this.chess.reset();
  }

  // Make a move on the board
  makeMove(move: AIFunctionCallResponse): boolean {
    try {
      console.log(`🎲 Chess Service: Attempting move ${move.from} -> ${move.to}${move.promotion ? ` (=${move.promotion})` : ''}`);
      
      // Log current position for debugging
      console.log(`📍 Current FEN: ${this.chess.fen()}`);
      console.log(`📍 Current turn: ${this.chess.turn()}`);
      
      // Check if the move is in the correct format for chess.js
      const moveObj: any = {
        from: move.from,
        to: move.to
      };
      
      // Only add promotion if it exists
      if (move.promotion) {
        moveObj.promotion = move.promotion;
      }
      
      console.log(`🔧 Move object for chess.js:`, moveObj);
      
      // Attempt to make the move
      const result = this.chess.move(moveObj);
      
      console.log(`🎯 Chess.js move result:`, result);

      // If the move is valid, return true
      if (result) {
        console.log(`✅ Move successful: ${result.san}`);
        return true;
      } else {
        console.error(`❌ Chess.js rejected the move`);
        return false;
      }
    } catch (error) {
      console.error(`💥 Chess Service: Move failed with error:`, error);
      console.error(`🔍 Failed move details:`, move);
      
      // Log available moves for debugging
      const legalMoves = this.chess.moves({ verbose: true });
      console.log(`📋 Legal moves available: ${legalMoves.map(m => m.san).join(', ')}`);
      
      return false;
    }
  }

  // Get all legal moves in the current position
  getAllLegalMoves(): Move[] {
    // Get all possible moves in verbose format
    const legalMoves = this.chess.moves({ verbose: true });
    
    // Convert to our Move interface format
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

  // Get a list of valid moves for the current position
  getValidMoves(): { [square: string]: string[] } {
    const moves: { [square: string]: string[] } = {};
    
    // Get all possible moves
    const possibleMoves = this.chess.moves({ verbose: true });
    
    // Group moves by starting square
    possibleMoves.forEach(move => {
      if (!moves[move.from]) {
        moves[move.from] = [];
      }
      moves[move.from].push(move.to);
    });
    
    return moves;
  }

  // Get a representation of the board with piece positions
  getBoardPosition(): any {
    return this.chess.board();
  }

  // Convert chess.js move history to our Move interface
  private mapMoveHistory(): Move[] {
    const history = this.chess.history({ verbose: true });
    
    return history.map((move, index) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      piece: move.piece,
      color: move.color,
      san: move.san,
      timestamp: Date.now() - (history.length - index) * 1000 // Approximate timestamp
    }));
  }
}

// Create and export a singleton instance
export const chessService = new ChessService(); 