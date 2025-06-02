import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Stack
} from '@mui/material';
import { Move } from '../types';

interface CompactMoveHistoryProps {
  moves: Move[];
  maxHeight?: number;
}

const CompactMoveHistory: React.FC<CompactMoveHistoryProps> = ({ 
  moves, 
  maxHeight = 200 
}) => {
  // Group moves into pairs (white, black)
  const movePairs: Array<{white?: Move, black?: Move, moveNumber: number}> = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i];
    const black = moves[i + 1];
    movePairs.push({
      white,
      black,
      moveNumber: Math.floor(i / 2) + 1
    });
  }

  if (moves.length === 0) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          background: '#f8f9fa',
          border: '1px solid #dee2e6'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
          Move History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Game hasn't started yet
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        background: '#f8f9fa',
        border: '1px solid #dee2e6'
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
        Move History ({moves.length} moves)
      </Typography>
      
      <Box 
        sx={{ 
          maxHeight, 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          },
        }}
      >
        <Stack spacing={0.5}>
          {movePairs.map((pair, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: 1,
                backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
              }}
            >
              {/* Move number */}
              <Typography 
                variant="caption" 
                sx={{ 
                  minWidth: 24,
                  color: '#6c757d',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {pair.moveNumber}.
              </Typography>
              
              {/* White move */}
              <Chip
                label={pair.white?.san || ''}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  borderColor: '#e9ecef',
                  backgroundColor: '#ffffff',
                  color: '#495057',
                  margin: '0 4px',
                  minWidth: 40,
                  '& .MuiChip-label': {
                    padding: '0 6px',
                  }
                }}
              />
              
              {/* Black move */}
              {pair.black && (
                <Chip
                  label={pair.black.san}
                  size="small"
                  variant="filled"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    backgroundColor: '#495057',
                    color: '#ffffff',
                    margin: '0 4px',
                    minWidth: 40,
                    '& .MuiChip-label': {
                      padding: '0 6px',
                    }
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>
      </Box>
      
      {/* Last move indicator */}
      {moves.length > 0 && (
        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #dee2e6' }}>
          <Typography variant="caption" sx={{ color: '#6c757d' }}>
            Last: <strong>{moves[moves.length - 1].san}</strong> by {moves[moves.length - 1].color === 'w' ? 'White' : 'Black'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CompactMoveHistory; 