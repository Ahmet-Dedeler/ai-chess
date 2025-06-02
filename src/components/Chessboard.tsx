// Import necessary libraries and components
import React, { useEffect, useState, useRef } from 'react';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import { Box, Typography, Dialog, DialogTitle, DialogContent, Button, Grid } from '@mui/material';
import { GameState } from '../types';

// Define the props for the Chessboard component
interface ChessboardProps {
  gameState: GameState; // The current state of the game
  width?: number; // Optional width of the chessboard
  onBoardRef?: (ref: HTMLElement | null) => void; // Optional callback to pass the board reference
  onHumanMove?: (from: string, to: string, promotion?: string) => void; // Callback for human moves
  isHumanTurn?: boolean; // Whether it's currently the human's turn
  humanColor?: 'white' | 'black'; // The color the human is playing as
}

// Chessboard component definition
const Chessboard: React.FC<ChessboardProps> = ({ 
  gameState, 
  width = 600, 
  onBoardRef, 
  onHumanMove,
  isHumanTurn = false,
  humanColor = 'white'
}) => {
  // State to hold the current position of the chess pieces using FEN string
  const [position, setPosition] = useState(gameState.fen);
  // Reference to the chessboard DOM element
  const boardRef = useRef<HTMLDivElement>(null);
  // State for promotion dialog
  const [promotionDialog, setPromotionDialog] = useState<{
    show: boolean;
    from: string;
    to: string;
  }>({ show: false, from: '', to: '' });
  
  // State for highlighting squares
  const [highlightedSquares, setHighlightedSquares] = useState<{[square: string]: { backgroundColor: string }}>({});
  
  // Effect to update the board position whenever the game state changes
  useEffect(() => {
    setPosition(gameState.fen);
  }, [gameState.fen]);

  // Effect to pass the board reference to the parent component for purposes like image capture
  useEffect(() => {
    if (onBoardRef && boardRef.current) {
      onBoardRef(boardRef.current);
    }
  }, [onBoardRef]);

  // Check if a move is a promotion
  const isPromotionMove = (piece: string, sourceSquare: string, targetSquare: string): boolean => {
    const isPawn = piece.toLowerCase().includes('p');
    if (!isPawn) return false;
    
    const targetRank = targetSquare[1];
    const isWhitePawn = piece[0] === 'w';
    const isBlackPawn = piece[0] === 'b';
    
    return (isWhitePawn && targetRank === '8') || (isBlackPawn && targetRank === '1');
  };

  // Handle promotion piece selection
  const handlePromotionSelect = (piece: string) => {
    const { from, to } = promotionDialog;
    setPromotionDialog({ show: false, from: '', to: '' });
    
    if (onHumanMove) {
      onHumanMove(from, to, piece.toLowerCase());
    }
  };

  // Handle piece drop for human moves
  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string): boolean => {
    // Only allow moves if it's the human's turn and they have a move handler
    if (!isHumanTurn || !onHumanMove) {
      console.log('Move rejected: Not human turn or no move handler');
      return false;
    }

    // Check if it's the correct color's turn
    const pieceColor = piece[0] === 'w' ? 'white' : 'black';
    if (pieceColor !== humanColor) {
      console.log(`Move rejected: Wrong piece color. Piece is ${pieceColor}, human is ${humanColor}`);
      return false;
    }

    // Check if it's actually the human's turn based on game state
    const currentTurnColor = gameState.turn === 'w' ? 'white' : 'black';
    if (currentTurnColor !== humanColor) {
      console.log(`Move rejected: Not human's turn. Current turn: ${currentTurnColor}, human: ${humanColor}`);
      return false;
    }

    console.log(`Attempting move: ${sourceSquare} -> ${targetSquare} (piece: ${piece})`);

    // Check if this is a promotion move
    if (isPromotionMove(piece, sourceSquare, targetSquare)) {
      console.log('Promotion detected, showing promotion dialog');
      setPromotionDialog({
        show: true,
        from: sourceSquare,
        to: targetSquare
      });
      return true; // Allow the visual move, promotion will be handled in dialog
    }

    // Regular move - call the move handler
    onHumanMove(sourceSquare, targetSquare);
    
    // Return true to allow the move (the parent will validate and update)
    return true;
  };

  // Handle square click for highlighting
  const handleSquareClick = (square: string) => {
    setHighlightedSquares(prev => {
      const newHighlights = { ...prev };
      if (newHighlights[square]) {
        // Remove highlight if already highlighted
        delete newHighlights[square];
      } else {
        // Add highlight
        newHighlights[square] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      }
      return newHighlights;
    });
  };

  // Handle right click for highlighting (alternative method)
  const handleSquareRightClick = (square: string) => {
    setHighlightedSquares(prev => {
      const newHighlights = { ...prev };
      if (newHighlights[square]) {
        // Cycle through highlight colors or remove
        if (newHighlights[square].backgroundColor === 'rgba(255, 255, 0, 0.4)') {
          newHighlights[square] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
        } else if (newHighlights[square].backgroundColor === 'rgba(255, 0, 0, 0.4)') {
          newHighlights[square] = { backgroundColor: 'rgba(0, 255, 0, 0.4)' };
        } else {
          delete newHighlights[square];
        }
      } else {
        newHighlights[square] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      }
      return newHighlights;
    });
  };

  return (
    <Box sx={{ width: width, margin: '0 auto' }}>
      {/* Render the chessboard with the current position */}
      <div ref={boardRef}>
        <ReactChessboard 
          position={position} // Set the position of the pieces
          boardWidth={width} // Set the width of the board
          areArrowsAllowed={true} // Allow arrows on the board for move indication
          onPieceDrop={handlePieceDrop} // Handle piece drops for human moves
          onSquareClick={handleSquareClick} // Handle square clicks for highlighting
          onSquareRightClick={handleSquareRightClick} // Handle right clicks for highlighting
          arePiecesDraggable={isHumanTurn} // Only allow dragging when it's human's turn
          boardOrientation={humanColor === 'black' ? 'black' : 'white'} // Orient board based on human color
          customBoardStyle={{
            borderRadius: '4px', // Rounded corners for the board
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' // Enhanced shadow for better depth
          }}
          customSquareStyles={highlightedSquares} // Apply highlighting
          animationDuration={200} // Smooth animations
        />
      </div>

      {/* Promotion Dialog */}
      <Dialog 
        open={promotionDialog.show} 
        onClose={() => setPromotionDialog({ show: false, from: '', to: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Choose Promotion Piece</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handlePromotionSelect('q')}
                sx={{ fontSize: '2rem', aspectRatio: '1' }}
              >
                ♕
              </Button>
              <Typography variant="caption" align="center" display="block">
                Queen
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handlePromotionSelect('r')}
                sx={{ fontSize: '2rem', aspectRatio: '1' }}
              >
                ♖
              </Button>
              <Typography variant="caption" align="center" display="block">
                Rook
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handlePromotionSelect('b')}
                sx={{ fontSize: '2rem', aspectRatio: '1' }}
              >
                ♗
              </Button>
              <Typography variant="caption" align="center" display="block">
                Bishop
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handlePromotionSelect('n')}
                sx={{ fontSize: '2rem', aspectRatio: '1' }}
              >
                ♘
              </Button>
              <Typography variant="caption" align="center" display="block">
                Knight
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      
      {/* Display game status messages below the board */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        {gameState.gameOver && (
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {gameState.winner ? `${gameState.winner === 'white' ? 'White' : 'Black'} wins!` : 'Game Over'}
          </Typography>
        )}
        {gameState.inCheck && !gameState.gameOver && (
          <Typography variant="body1" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
            {gameState.turn === 'w' ? 'White' : 'Black'} is in check!
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Export the Chessboard component as the default export
export default Chessboard; 