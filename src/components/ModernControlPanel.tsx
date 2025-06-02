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
  ButtonGroup,
  Chip,
  Stack,
  SelectChangeEvent,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Refresh,
  SmartToy,
  Person,
  Psychology,
  Speed,
  Settings,
  Computer,
  EmojiObjects
} from '@mui/icons-material';
import { PlayerConfig, GameMode } from '../types';

interface ModernControlPanelProps {
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  whitePlayer: PlayerConfig;
  blackPlayer: PlayerConfig;
  onWhitePlayerChange: (config: PlayerConfig) => void;
  onBlackPlayerChange: (config: PlayerConfig) => void;
  onStartGame: () => void;
  onResetGame: () => void;
  isGameRunning: boolean;
  isGameOver: boolean;
  isThinking: boolean;
  currentTurn: 'w' | 'b';
  availableModels: string[];
  isLoadingModels: boolean;
}

// Popular models as requested
const POPULAR_MODELS = ['gpt-4o', 'gpt-4.1', 'o3', 'o4-mini'];

const ModernControlPanel: React.FC<ModernControlPanelProps> = ({
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

  const handleGameModeChange = (newMode: GameMode) => {
    onGameModeChange(newMode);
    
    if (newMode === 'human-vs-ai') {
      onWhitePlayerChange({ color: 'white', type: 'human' });
      onBlackPlayerChange({ 
        color: 'black', 
        type: 'ai', 
        model: POPULAR_MODELS[0] || availableModels[0] || '' 
      });
    } else {
      onWhitePlayerChange({ 
        color: 'white', 
        type: 'ai', 
        model: POPULAR_MODELS[0] || availableModels[0] || '' 
      });
      onBlackPlayerChange({ 
        color: 'black', 
        type: 'ai', 
        model: POPULAR_MODELS[1] || availableModels[1] || availableModels[0] || '' 
      });
    }
  };

  const handleHumanColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const humanColor = event.target.value as 'white' | 'black';
    
    if (humanColor === 'white') {
      onWhitePlayerChange({ color: 'white', type: 'human' });
      onBlackPlayerChange({
        color: 'black',
        type: 'ai',
        model: blackPlayer.model || POPULAR_MODELS[0] || availableModels[0] || ''
      });
    } else {
      onWhitePlayerChange({
        color: 'white',
        type: 'ai',
        model: whitePlayer.model || POPULAR_MODELS[0] || availableModels[0] || ''
      });
      onBlackPlayerChange({ color: 'black', type: 'human' });
    }
  };

  const handleModelChange = (color: 'white' | 'black', model: string) => {
    if (color === 'white') {
      onWhitePlayerChange({ ...whitePlayer, model });
    } else {
      onBlackPlayerChange({ ...blackPlayer, model });
    }
  };

  const getHumanColor = () => {
    return whitePlayer.type === 'human' ? 'white' : 'black';
  };

  const getPopularModels = () => {
    return POPULAR_MODELS.filter(model => availableModels.includes(model));
  };

  const getOtherModels = () => {
    return availableModels.filter(model => !POPULAR_MODELS.includes(model));
  };

  // Check if the game can be started based on current configuration
  const canStartGame = () => {
    if (isGameRunning) return false;
    
    // In human vs AI mode, only the AI player needs a model
    if (gameMode === 'human-vs-ai') {
      if (whitePlayer.type === 'ai') {
        return !!whitePlayer.model;
      } else {
        return !!blackPlayer.model;
      }
    }
    
    // In AI vs AI modes, both players need models
    return !!whitePlayer.model && !!blackPlayer.model;
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #dee2e6'
      }}
    >
      <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
        
        {/* Game Mode Selection */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
            Game Mode
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Simple AI vs AI - Quick gameplay">
              <Button
                variant={gameMode === 'simple' ? 'contained' : 'outlined'}
                onClick={() => handleGameModeChange('simple')}
                disabled={isGameRunning}
                startIcon={<Speed />}
                sx={{ 
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: gameMode === 'simple' ? 600 : 400
                }}
              >
                Simple
              </Button>
            </Tooltip>
            <Tooltip title="Human vs AI - Play against computer">
              <Button
                variant={gameMode === 'human-vs-ai' ? 'contained' : 'outlined'}
                onClick={() => handleGameModeChange('human-vs-ai')}
                disabled={isGameRunning}
                startIcon={<Person />}
                sx={{ 
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: gameMode === 'human-vs-ai' ? 600 : 400
                }}
              >
                vs AI
              </Button>
            </Tooltip>
            <Tooltip title="Complex AI vs AI - Full analysis & strategy">
              <Button
                variant={gameMode === 'complex' ? 'contained' : 'outlined'}
                onClick={() => handleGameModeChange('complex')}
                disabled={isGameRunning}
                startIcon={<Psychology />}
                sx={{ 
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: gameMode === 'complex' ? 600 : 400
                }}
              >
                Complex
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Human vs AI Settings */}
        {gameMode === 'human-vs-ai' && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
                Your Color
              </Typography>
              <RadioGroup
                row
                value={getHumanColor()}
                onChange={handleHumanColorChange}
              >
                <FormControlLabel 
                  value="white" 
                  control={<Radio size="small" disabled={isGameRunning} />} 
                  label="White" 
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
                <FormControlLabel 
                  value="black" 
                  control={<Radio size="small" disabled={isGameRunning} />} 
                  label="Black" 
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
              </RadioGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
                AI Opponent
              </Typography>
              <Stack direction="row" spacing={1}>
                {getPopularModels().map((model) => (
                  <Chip
                    key={model}
                    label={model}
                    variant={
                      (whitePlayer.type === 'ai' ? whitePlayer.model : blackPlayer.model) === model 
                        ? 'filled' : 'outlined'
                    }
                    onClick={() => handleModelChange(
                      whitePlayer.type === 'ai' ? 'white' : 'black', 
                      model
                    )}
                    disabled={isGameRunning}
                    size="small"
                    icon={<SmartToy />}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  />
                ))}
                <FormControl size="small" sx={{ minWidth: 60 }}>
                  <Select
                    value=""
                    displayEmpty
                    disabled={isGameRunning}
                    onChange={(e) => handleModelChange(
                      whitePlayer.type === 'ai' ? 'white' : 'black', 
                      e.target.value
                    )}
                    renderValue={() => '...'}
                    sx={{ 
                      '& .MuiSelect-select': { 
                        paddingY: 0.5, 
                        fontSize: '0.875rem' 
                      } 
                    }}
                  >
                    {getOtherModels().map((model) => (
                      <MenuItem key={model} value={model} sx={{ fontSize: '0.875rem' }}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          </>
        )}

        {/* AI vs AI Settings */}
        {(gameMode === 'simple' || gameMode === 'complex') && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
                White AI
              </Typography>
              <Stack direction="row" spacing={1}>
                {getPopularModels().slice(0, 2).map((model) => (
                  <Chip
                    key={model}
                    label={model}
                    variant={whitePlayer.model === model ? 'filled' : 'outlined'}
                    onClick={() => handleModelChange('white', model)}
                    disabled={isGameRunning}
                    size="small"
                    icon={<Computer />}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  />
                ))}
                <FormControl size="small" sx={{ minWidth: 60 }}>
                  <Select
                    value={whitePlayer.model || ''}
                    disabled={isGameRunning}
                    onChange={(e) => handleModelChange('white', e.target.value)}
                    displayEmpty
                    renderValue={(value) => value ? (value.length > 8 ? `${value.slice(0, 8)}...` : value) : '...'}
                    sx={{ '& .MuiSelect-select': { paddingY: 0.5, fontSize: '0.875rem' } }}
                  >
                    {availableModels.map((model) => (
                      <MenuItem key={model} value={model} sx={{ fontSize: '0.875rem' }}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
                Black AI
              </Typography>
              <Stack direction="row" spacing={1}>
                {getPopularModels().slice(0, 2).map((model) => (
                  <Chip
                    key={model}
                    label={model}
                    variant={blackPlayer.model === model ? 'filled' : 'outlined'}
                    onClick={() => handleModelChange('black', model)}
                    disabled={isGameRunning}
                    size="small"
                    icon={<Computer />}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  />
                ))}
                <FormControl size="small" sx={{ minWidth: 60 }}>
                  <Select
                    value={blackPlayer.model || ''}
                    disabled={isGameRunning}
                    onChange={(e) => handleModelChange('black', e.target.value)}
                    displayEmpty
                    renderValue={(value) => value ? (value.length > 8 ? `${value.slice(0, 8)}...` : value) : '...'}
                    sx={{ '& .MuiSelect-select': { paddingY: 0.5, fontSize: '0.875rem' } }}
                  >
                    {availableModels.map((model) => (
                      <MenuItem key={model} value={model} sx={{ fontSize: '0.875rem' }}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          </>
        )}

        <Divider orientation="vertical" flexItem />

        {/* Game Controls */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
            Controls
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={onStartGame}
              disabled={!canStartGame()}
              startIcon={isThinking ? <CircularProgress size={16} /> : <PlayArrow />}
              size="small"
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#28a745',
                '&:hover': { bgcolor: '#218838' }
              }}
            >
              {isGameRunning ? 'Running' : 'Start'}
            </Button>
            <Button
              variant="outlined"
              onClick={onResetGame}
              startIcon={<Refresh />}
              size="small"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Reset
            </Button>
          </Stack>
        </Box>

        {/* Status */}
        {isGameRunning && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
              Status
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={currentTurn === 'w' ? 'White to move' : 'Black to move'}
                size="small"
                icon={currentTurn === 'w' ? <EmojiObjects /> : <SmartToy />}
                color={currentTurn === 'w' ? 'default' : 'primary'}
                variant="outlined"
              />
              {isThinking && (
                <Chip
                  label="Thinking..."
                  size="small"
                  icon={<CircularProgress size={12} />}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default ModernControlPanel; 