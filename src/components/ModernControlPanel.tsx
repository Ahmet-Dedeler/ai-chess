import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  Button, 
  Chip,
  Stack,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  PlayArrow,
  Refresh,
  SmartToy,
  Person,
  Psychology,
  Speed,
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

  // Extract main category and complexity from game mode
  const getMainCategory = (mode: GameMode): 'ai-vs-ai' | 'human-vs-ai' => {
    return mode.startsWith('ai-vs-ai') ? 'ai-vs-ai' : 'human-vs-ai';
  };

  const getComplexity = (mode: GameMode): 'simple' | 'complex' => {
    return mode.endsWith('simple') ? 'simple' : 'complex';
  };

  const [mainCategory, setMainCategory] = useState<'ai-vs-ai' | 'human-vs-ai'>(getMainCategory(gameMode));
  const [complexity, setComplexity] = useState<'simple' | 'complex'>(getComplexity(gameMode));

  // Sync internal state with gameMode prop changes
  React.useEffect(() => {
    setMainCategory(getMainCategory(gameMode));
    setComplexity(getComplexity(gameMode));
  }, [gameMode]);

  const handleMainCategoryChange = (newCategory: 'ai-vs-ai' | 'human-vs-ai') => {
    setMainCategory(newCategory);
    const newMode: GameMode = `${newCategory}-${complexity}` as GameMode;
    onGameModeChange(newMode);
    
    // Set appropriate player configurations
    if (newCategory === 'human-vs-ai') {
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

  const handleComplexityChange = (newComplexity: 'simple' | 'complex') => {
    setComplexity(newComplexity);
    const newMode: GameMode = `${mainCategory}-${newComplexity}` as GameMode;
    onGameModeChange(newMode);
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
    if (mainCategory === 'human-vs-ai') {
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
        
        {/* Main Game Mode Selection */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
            Game Type
          </Typography>
          <ToggleButtonGroup
            value={mainCategory}
            exclusive
            onChange={(event, newCategory) => {
              if (newCategory !== null) {
                handleMainCategoryChange(newCategory);
              }
            }}
            size="small"
            disabled={isGameRunning}
          >
            <ToggleButton value="ai-vs-ai" sx={{ textTransform: 'none', minWidth: 100 }}>
              <Computer sx={{ mr: 1 }} />
              AI vs AI
            </ToggleButton>
            <ToggleButton value="human-vs-ai" sx={{ textTransform: 'none', minWidth: 100 }}>
              <Person sx={{ mr: 1 }} />
              Human vs AI
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Complexity Selection */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
            AI Complexity
          </Typography>
          <ToggleButtonGroup
            value={complexity}
            exclusive
            onChange={(event, newComplexity) => {
              if (newComplexity !== null) {
                handleComplexityChange(newComplexity);
              }
            }}
            size="small"
            disabled={isGameRunning}
          >
            <ToggleButton value="simple" sx={{ textTransform: 'none', minWidth: 80 }}>
              <Speed sx={{ mr: 1 }} />
              Simple
            </ToggleButton>
            <ToggleButton value="complex" sx={{ textTransform: 'none', minWidth: 80 }}>
              <Psychology sx={{ mr: 1 }} />
              Complex
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Human vs AI Settings */}
        {mainCategory === 'human-vs-ai' && (
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
        {mainCategory === 'ai-vs-ai' && (
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