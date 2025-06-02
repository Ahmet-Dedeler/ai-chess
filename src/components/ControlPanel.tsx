// Import necessary libraries and components from React and Material-UI
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Stack,
  SelectChangeEvent,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import { PlayerConfig, GameMode } from '../types';

// Define the props for the ControlPanel component
interface ControlPanelProps {
  gameMode: GameMode; // Current game mode (complex, simple, or human-vs-ai)
  onGameModeChange: (mode: GameMode) => void; // Callback for changing the game mode
  whitePlayer: PlayerConfig; // Configuration for the white player
  blackPlayer: PlayerConfig; // Configuration for the black player
  onWhitePlayerChange: (config: PlayerConfig) => void; // Callback for changing the white player config
  onBlackPlayerChange: (config: PlayerConfig) => void; // Callback for changing the black player config
  onStartGame: () => void; // Callback for starting the game
  onResetGame: () => void; // Callback for resetting the game
  isGameRunning: boolean; // Flag indicating if the game is currently running
  isGameOver: boolean; // Flag indicating if the game is over
  isThinking: boolean; // Flag indicating if the AI is currently thinking
  currentTurn: 'w' | 'b'; // Current turn, either white ('w') or black ('b')
  availableModels: string[]; // List of available AI models
  isLoadingModels: boolean; // Flag indicating if the models are currently loading
}

// ControlPanel component definition
const ControlPanel: React.FC<ControlPanelProps> = ({
  gameMode,
  onGameModeChange,
  whitePlayer,
  blackPlayer,
  onWhitePlayerChange,
  onBlackPlayerChange,
  onStartGame,
  onResetGame,
  isGameRunning,
  isGameOver,
  isThinking,
  currentTurn,
  availableModels,
  isLoadingModels
}) => {
  // Handler for game mode change
  const handleGameModeChange = (event: SelectChangeEvent) => {
    const newMode = event.target.value as GameMode;
    onGameModeChange(newMode);
    
    // If switching to human-vs-ai, set up default configuration
    if (newMode === 'human-vs-ai') {
      // Set white as human, black as AI by default
      onWhitePlayerChange({
        color: 'white',
        type: 'human'
      });
      onBlackPlayerChange({
        color: 'black',
        type: 'ai',
        model: availableModels[0] || ''
      });
    } else {
      // For AI vs AI modes, set both as AI
      onWhitePlayerChange({
        color: 'white',
        type: 'ai',
        model: availableModels[0] || ''
      });
      onBlackPlayerChange({
        color: 'black',
        type: 'ai',
        model: availableModels[1] || availableModels[0] || ''
      });
    }
  };

  // Handler for human color selection in human-vs-ai mode
  const handleHumanColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const humanColor = event.target.value as 'white' | 'black';
    
    if (humanColor === 'white') {
      onWhitePlayerChange({
        color: 'white',
        type: 'human'
      });
      onBlackPlayerChange({
        color: 'black',
        type: 'ai',
        model: blackPlayer.model || availableModels[0] || ''
      });
    } else {
      onWhitePlayerChange({
        color: 'white',
        type: 'ai',
        model: whitePlayer.model || availableModels[0] || ''
      });
      onBlackPlayerChange({
        color: 'black',
        type: 'human'
      });
    }
  };

  // Handler for AI model change in human-vs-ai mode
  const handleAIModelChange = (event: SelectChangeEvent) => {
    const model = event.target.value;
    const isWhiteAI = whitePlayer.type === 'ai';
    
    if (isWhiteAI) {
      onWhitePlayerChange({
        ...whitePlayer,
        model
      });
    } else {
      onBlackPlayerChange({
        ...blackPlayer,
        model
      });
    }
  };

  // Handler for white player model change in AI vs AI modes
  const handleWhiteModelChange = (event: SelectChangeEvent) => {
    onWhitePlayerChange({
      ...whitePlayer,
      model: event.target.value
    });
  };

  // Handler for black player model change in AI vs AI modes
  const handleBlackModelChange = (event: SelectChangeEvent) => {
    onBlackPlayerChange({
      ...blackPlayer,
      model: event.target.value
    });
  };

  // Get the human player color in human-vs-ai mode
  const getHumanColor = () => {
    return whitePlayer.type === 'human' ? 'white' : 'black';
  };

  // Get the AI player in human-vs-ai mode
  const getAIPlayer = () => {
    return whitePlayer.type === 'ai' ? whitePlayer : blackPlayer;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: '4px' }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        AI Chess Battle Control Panel
      </Typography>

      {/* Game Mode Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Game Mode
        </Typography>
        
        <FormControl fullWidth>
          <InputLabel id="game-mode-label">Game Mode</InputLabel>
          <Select
            labelId="game-mode-label"
            id="game-mode-select"
            value={gameMode}
            label="Game Mode"
            onChange={handleGameModeChange}
            disabled={isGameRunning}
          >
            <MenuItem value="complex">
              AI vs AI (Complex) - Full analysis, strategy, memory
            </MenuItem>
            <MenuItem value="simple">
              AI vs AI (Simple) - Grandmaster prompt only
            </MenuItem>
            <MenuItem value="human-vs-ai">
              Human vs AI - Play against the computer
            </MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {gameMode === 'complex' 
            ? 'Full AI with strategic planning, position analysis, and memory systems'
            : gameMode === 'simple'
            ? 'Simplified AI with basic grandmaster instructions and move history only'
            : 'Play chess against an AI opponent - choose your color and opponent model'
          }
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Human vs AI Configuration */}
      {gameMode === 'human-vs-ai' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Player Configuration
          </Typography>
          
          <Stack spacing={3}>
            {/* Human color selection */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Choose your color:</FormLabel>
              <RadioGroup
                row
                value={getHumanColor()}
                onChange={handleHumanColorChange}
              >
                <FormControlLabel 
                  value="white" 
                  control={<Radio />} 
                  label="White (First move)" 
                  disabled={isGameRunning}
                />
                <FormControlLabel 
                  value="black" 
                  control={<Radio />} 
                  label="Black" 
                  disabled={isGameRunning}
                />
              </RadioGroup>
            </FormControl>

            {/* AI opponent selection */}
            <FormControl fullWidth>
              <InputLabel id="ai-opponent-label">AI Opponent</InputLabel>
              <Select
                labelId="ai-opponent-label"
                id="ai-opponent-select"
                value={getAIPlayer().model || ''}
                label="AI Opponent"
                onChange={handleAIModelChange}
                disabled={isGameRunning || isLoadingModels}
              >
                {isLoadingModels ? (
                  <MenuItem value="" disabled>
                    Loading models...
                  </MenuItem>
                ) : (
                  availableModels.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      )}

      {/* AI vs AI Configuration */}
      {(gameMode === 'complex' || gameMode === 'simple') && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select AI Models
          </Typography>
          
          <Stack spacing={2}>
            {/* White player selection */}
            <FormControl fullWidth>
              <InputLabel id="white-player-label">White Player</InputLabel>
              <Select
                labelId="white-player-label"
                id="white-player-select"
                value={whitePlayer.model || ''}
                label="White Player"
                onChange={handleWhiteModelChange}
                disabled={isGameRunning || isLoadingModels}
              >
                {isLoadingModels ? (
                  <MenuItem value="" disabled>
                    Loading models...
                  </MenuItem>
                ) : (
                  availableModels.map((model) => (
                    <MenuItem key={`white-${model}`} value={model}>
                      {model}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Black player selection */}
            <FormControl fullWidth>
              <InputLabel id="black-player-label">Black Player</InputLabel>
              <Select
                labelId="black-player-label"
                id="black-player-select"
                value={blackPlayer.model || ''}
                label="Black Player"
                onChange={handleBlackModelChange}
                disabled={isGameRunning || isLoadingModels}
              >
                {isLoadingModels ? (
                  <MenuItem value="" disabled>
                    Loading models...
                  </MenuItem>
                ) : (
                  availableModels.map((model) => (
                    <MenuItem key={`black-${model}`} value={model}>
                      {model}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      )}

      {/* Game controls */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            onClick={onStartGame}
            disabled={isGameRunning || isGameOver || isLoadingModels}
          >
            Start Game
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            fullWidth
            onClick={onResetGame}
            disabled={isThinking}
          >
            Reset Game
          </Button>
        </Stack>
      </Box>

      {/* Game status */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        {isLoadingModels && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Loading available models
            </Typography>
            <CircularProgress size={20} />
          </Box>
        )}
        
        {isGameRunning && !isGameOver && gameMode !== 'human-vs-ai' && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              {currentTurn === 'w' ? 'White' : 'Black'} is thinking ({gameMode} mode)
            </Typography>
            {isThinking && <CircularProgress size={20} />}
          </Box>
        )}

        {isGameRunning && !isGameOver && gameMode === 'human-vs-ai' && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              {(() => {
                const humanColor = getHumanColor();
                const currentTurnColor = currentTurn === 'w' ? 'white' : 'black';
                const isHumanTurn = humanColor === currentTurnColor;
                
                if (isHumanTurn) {
                  return 'Your turn!';
                } else {
                  return 'AI is thinking...';
                }
              })()}
            </Typography>
            {isThinking && <CircularProgress size={20} />}
          </Box>
        )}
        
        {isGameOver && (
          <Typography variant="body1" color="primary">
            Game completed! You can reset to play again.
          </Typography>
        )}
        
        {!isGameRunning && !isGameOver && !isLoadingModels && (
          <Typography variant="body2" color="text.secondary">
            {gameMode === 'human-vs-ai' 
              ? 'Choose your color, select AI opponent, and press Start Game'
              : 'Select AI mode, models and press Start Game'
            }
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

// Export the ControlPanel component as the default export
export default ControlPanel; 