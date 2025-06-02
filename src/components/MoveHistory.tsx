import React from 'react';
import { Box, Paper, Typography, List, ListItem, Divider } from '@mui/material';
import { Move } from '../types';

// Define the props for the MoveHistory component
interface MoveHistoryProps {
  moves: Move[]; // Array of moves to display in the history
  maxHeight?: number; // Optional maximum height for the move list
}

// MoveHistory component definition
const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, maxHeight = 400 }) => {
  // Group moves by pairs (white and black)
  const groupedMoves: { number: number; white?: Move; black?: Move }[] = [];
  
  // Iterate over the moves to group them into pairs
  moves.forEach((move, index) => {
    const moveNumber = Math.floor(index / 2) + 1; // Calculate the move number
    
    if (index % 2 === 0) {
      // If the index is even, it's White's move
      groupedMoves.push({
        number: moveNumber,
        white: move
      });
    } else {
      // If the index is odd, it's Black's move, add to the previous entry
      groupedMoves[moveNumber - 1].black = move;
    }
  });

  return (
    <Paper elevation={3} sx={{ width: '100%', mb: 2, borderRadius: '4px' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
        <Typography variant="h6">Move History</Typography>
      </Box>
      
      <List sx={{ maxHeight, overflow: 'auto', p: 0 }}>
        {groupedMoves.map((group, index) => (
          <React.Fragment key={group.number}>
            <ListItem sx={{ display: 'flex', py: 1 }}>
              <Box sx={{ width: '15%', fontWeight: 'bold', pl: 1 }}>
                {group.number}. {/* Display the move number */}
              </Box>
              <Box sx={{ width: '42.5%' }}>
                {group.white?.san} {/* Display White's move in SAN format */}
              </Box>
              <Box sx={{ width: '42.5%' }}>
                {group.black?.san} {/* Display Black's move in SAN format */}
              </Box>
            </ListItem>
            {index < groupedMoves.length - 1 && <Divider />} {/* Add a divider between move pairs */}
          </React.Fragment>
        ))}
        
        {moves.length === 0 && (
          <ListItem>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              No moves yet {/* Display message if there are no moves */}
            </Typography>
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default MoveHistory; 