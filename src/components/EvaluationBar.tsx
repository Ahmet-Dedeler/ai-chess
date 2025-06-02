import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { GameState } from '../types';
import { stockfishService, EvaluationResult } from '../services/stockfishService';

interface EvaluationBarProps {
  gameState: GameState;
}

const EvaluationBar: React.FC<EvaluationBarProps> = ({ gameState }) => {
  const [evaluation, setEvaluation] = useState<number>(0);
  const [mate, setMate] = useState<number | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [depth, setDepth] = useState<number>(0);

  // Calculate chessboard height - same logic as in App.tsx
  const boardHeight = Math.min(560, window.innerWidth - 200);

  // Real Stockfish evaluation
  useEffect(() => {
    console.log('🔄 EvaluationBar: Position changed:', gameState.fen);
    
    // Don't analyze if game is over
    if (gameState.gameOver) {
      console.log('⏹️ Game is over, skipping evaluation');
      return;
    }

    setIsAnalyzing(true);
    
    // Use Stockfish to evaluate the current position
    const evaluateAsync = async () => {
      try {
        await stockfishService.evaluatePosition(gameState.fen, (result: EvaluationResult) => {
          console.log('📈 EvaluationBar: Received evaluation result:', result);
          
          // Convert centipawns to evaluation (centipawns / 100 = pawns)
          const evalInPawns = result.centipawns / 100;
          setEvaluation(evalInPawns);
          setMate(result.mate);
          setDepth(result.depth);
          setIsAnalyzing(false);
          
          console.log(`📊 EvaluationBar: Updated - eval=${evalInPawns}, mate=${result.mate}, depth=${result.depth}`);
        });
      } catch (error) {
        console.error('❌ EvaluationBar: Error evaluating position:', error);
        setIsAnalyzing(false);
      }
    };

    evaluateAsync();

    // Cleanup on unmount or position change
    return () => {
      stockfishService.stop();
    };
  }, [gameState.fen, gameState.gameOver]);

  // Convert evaluation to percentage for white (0-100, where 50 is equal)
  const getWhitePercentage = () => {
    // Handle mate scenarios
    if (mate !== undefined) {
      return mate > 0 ? 85 : 15; // Strong advantage/disadvantage for mate
    }
    
    // Clamp evaluation between -5 and +5 pawns, then convert to percentage
    const clampedEval = Math.max(-5, Math.min(5, evaluation));
    // +5 eval = 85% white, -5 eval = 15% white, 0 eval = 50% white
    return 50 + (clampedEval / 5) * 35;
  };

  const getEvaluationText = () => {
    // Show mate if available
    if (mate !== undefined) {
      return mate > 0 ? `M${mate}` : `M${Math.abs(mate)}`;
    }
    
    // Show evaluation in pawns
    if (Math.abs(evaluation) < 0.1) return '0.0';
    return (evaluation > 0 ? '+' : '') + evaluation.toFixed(1);
  };

  const whitePercentage = getWhitePercentage();

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Main evaluation bar */}
      <Box
        sx={{
          width: 20,
          height: boardHeight,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          backgroundColor: '#f0f0f0'
        }}
      >
        {/* Black section (top) */}
        <Box
          sx={{
            height: `${100 - whitePercentage}%`,
            backgroundColor: '#2c2c2c',
            transition: 'height 0.3s ease',
            minHeight: '15%', // Ensure black section is always visible
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />

        {/* White section (bottom) */}
        <Box
          sx={{
            height: `${whitePercentage}%`,
            backgroundColor: '#f0f0f0',
            transition: 'height 0.3s ease',
            minHeight: '15%', // Ensure white section is always visible
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Box>

      {/* Evaluation text below the bar */}
      <Box
        sx={{
          position: 'absolute',
          top: boardHeight + 8,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '4px 6px',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          minWidth: '36px',
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '11px',
            fontWeight: 'bold',
            color: mate !== undefined 
              ? (mate > 0 ? '#2e7d32' : '#d32f2f')
              : (evaluation > 0 ? '#2e7d32' : evaluation < 0 ? '#d32f2f' : '#666'),
            lineHeight: 1
          }}
        >
          {isAnalyzing ? '...' : getEvaluationText()}
        </Typography>
        
        {/* Show depth when not analyzing */}
        {!isAnalyzing && depth > 0 && (
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '8px',
              color: '#999',
              lineHeight: 1,
              display: 'block'
            }}
          >
            d{depth}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default EvaluationBar; 