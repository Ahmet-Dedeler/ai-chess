import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Grid,
  Box, 
  Typography, 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  CircularProgress, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Chip,
  Paper,
  Rating,
  Tooltip,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { toPng } from 'html-to-image';
import Chessboard from './components/Chessboard';
import CompactMoveHistory from './components/CompactMoveHistory';
import ModernControlPanel from './components/ModernControlPanel';
import EvaluationBar from './components/EvaluationBar';
import { chessService } from './services/chessService';
import { aiService } from './services/aiService';
import { simpleAiService } from './services/simpleAiService';
import { visionService } from './services/visionService';
import { memoryService } from './services/memoryService';
import { stockfishService } from './services/stockfishService';
import { GameState, AIModel, PlayerConfig, GameMode } from './types';

// Create a clean, modern theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          margin: '8px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          '&:before': {
            display: 'none',
          },
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          margin: '3px',
        }
      }
    },
  }
});

// Helper function to convert move evaluation score to Rating component value
const scoreToRating = (score: number): number => {
  const rating = (score + 10) / 4;
  return Math.max(0, Math.min(5, rating));
};

// Helper function to get color based on score
const getScoreColor = (score: number): string => {
  if (score < -5) return '#d32f2f';
  if (score < -2) return '#f44336';
  if (score < -0.5) return '#ff9800';
  if (score < 0.5) return '#9e9e9e';
  if (score < 2) return '#4caf50';
  if (score < 5) return '#2e7d32';
  return '#1b5e20';
};

const App: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>(chessService.getGameState());
  
  // Game mode - default to AI vs AI simple as requested
  const [gameMode, setGameMode] = useState<GameMode>('ai-vs-ai-simple');
  
  // Available models
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  
  // Game settings
  const [whitePlayer, setWhitePlayer] = useState<PlayerConfig>({
    color: 'white',
    type: 'ai',
    model: ''
  });
  
  const [blackPlayer, setBlackPlayer] = useState<PlayerConfig>({
    color: 'black',
    type: 'ai',
    model: ''
  });
  
  // Game control flags
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isStrategizing, setIsStrategizing] = useState<boolean>(false);
  const [visionAnalysis, setVisionAnalysis] = useState<string | null>(null);
  const [currentMoveAnalysis, setCurrentMoveAnalysis] = useState<string>('');
  
  // Board element reference
  const boardRef = useRef<HTMLElement | null>(null);

  // Handle board ref being set
  const handleBoardRef = (ref: HTMLElement | null) => {
    boardRef.current = ref;
  };

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const models = await aiService.fetchAvailableModels();
        console.log('📦 Available AI models loaded:', models);
        setAvailableModels(models);
        
        // Set default models if available
        if (models.length > 0) {
          const firstModel = models[0];
          const secondModel = models.length > 1 ? models[1] : models[0];
          
          console.log(`🔧 Setting default models: White=${firstModel}, Black=${secondModel}`);
          
          setWhitePlayer(prev => ({ ...prev, model: firstModel as AIModel }));
          setBlackPlayer(prev => ({ ...prev, model: secondModel as AIModel }));
        } else {
          console.warn('⚠️ No AI models available');
        }
      } catch (error) {
        console.error('❌ Error fetching models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    fetchModels();
  }, []);

  // Handle white player configuration change
  const handleWhitePlayerChange = (config: PlayerConfig) => {
    setWhitePlayer(config);
  };

  // Handle black player configuration change
  const handleBlackPlayerChange = (config: PlayerConfig) => {
    setBlackPlayer(config);
  };

  // Start the game
  const handleStartGame = () => {
    setIsGameRunning(true);
  };

  // Reset the game
  const handleResetGame = () => {
    chessService.resetGame();
    setGameState(chessService.getGameState());
    setIsGameRunning(false);
    setIsThinking(false);
    setIsAnalyzing(false);
    setIsStrategizing(false);
    setVisionAnalysis(null);
    setCurrentMoveAnalysis('');
    aiService.resetAI();
  };

  // Get the current player based on the turn
  const getCurrentPlayer = useCallback(() => {
    return gameState.turn === 'w' ? whitePlayer : blackPlayer;
  }, [gameState.turn, whitePlayer, blackPlayer]);

  // Check if it's currently a human player's turn
  const isHumanTurn = useCallback(() => {
    if (!gameMode.startsWith('human-vs-ai')) return false;
    const currentPlayer = getCurrentPlayer();
    return currentPlayer.type === 'human';
  }, [gameMode, getCurrentPlayer]);

  // Get the human player's color in human-vs-ai mode
  const getHumanColor = useCallback((): 'white' | 'black' | null => {
    if (!gameMode.startsWith('human-vs-ai')) return null;
    return whitePlayer.type === 'human' ? 'white' : 'black';
  }, [gameMode, whitePlayer.type]);

  // Handle human moves
  const handleHumanMove = (from: string, to: string, promotion?: string) => {
    if (!isHumanTurn()) {
      console.log('Rejected: Not human turn');
      return;
    }

    console.log(`Human move: ${from} -> ${to}${promotion ? ` (promote to ${promotion})` : ''}`);
    
    try {
      const move = chessService.makeMove({ from, to, promotion });
      if (move) {
        console.log('✅ Human move accepted:', move);
        setGameState(chessService.getGameState());
      } else {
        console.log('❌ Human move rejected: Invalid move');
      }
    } catch (error) {
      console.error('❌ Error making human move:', error);
    }
  };

  // AI game loop effect
  useEffect(() => {
    if (!isGameRunning || gameState.gameOver || isHumanTurn()) {
      return;
    }

    const makeAIMove = async () => {
      const currentPlayer = getCurrentPlayer();
      if (currentPlayer.type !== 'ai' || !currentPlayer.model) {
        console.error('❌ Current player is not AI or has no model');
        return;
      }

      setIsThinking(true);
      
      try {
        let moveResult;
        
        if (gameMode === 'ai-vs-ai-simple' || gameMode === 'human-vs-ai-simple') {
          moveResult = await simpleAiService.fetchNextMove(
            currentPlayer.model as AIModel,
            gameState,
            currentPlayer.color
          );
        } else {
          moveResult = await aiService.getNextMove(
            currentPlayer.model as AIModel,
            gameState,
            currentPlayer.color,
            visionAnalysis
          );
        }

        if (moveResult && moveResult.move) {
          const move = chessService.makeMove(moveResult.move);
          
          if (move) {
            console.log(`✅ AI move: ${moveResult.move.from} -> ${moveResult.move.to}${moveResult.move.promotion ? ` (${moveResult.move.promotion})` : ''}`);
            setGameState(chessService.getGameState());
            
            if (moveResult.moveAnalysis) {
              setCurrentMoveAnalysis(moveResult.moveAnalysis);
            }
          } else {
            console.error('❌ AI move was invalid');
          }
        }
      } catch (error) {
        console.error('❌ Error making AI move:', error);
      } finally {
        setIsThinking(false);
      }
    };

    const timeoutId = setTimeout(makeAIMove, 1000);
    return () => clearTimeout(timeoutId);
  }, [gameState.turn, isGameRunning, gameState.gameOver, getCurrentPlayer, isHumanTurn, gameMode, visionAnalysis]);

  // Handle game mode changes
  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode);
  };

  // Get memory info for strategy display
  const getMemoryInfo = (color: 'white' | 'black') => {
    return memoryService.getMemory(color);
  };

  const whiteMemory = getMemoryInfo('white');
  const blackMemory = getMemoryInfo('black');
  const showStrategyColumns = gameMode === 'ai-vs-ai-complex' && isGameRunning;

  // Cleanup Stockfish service on unmount
  useEffect(() => {
    return () => {
      stockfishService.destroy();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 2 }}>
        
        {/* Compact header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#495057' }}>
            AI Chess Battle
          </Typography>
        </Box>
        
        {/* Control panel - compact and at top */}
        <Box sx={{ mb: 3 }}>
          <ModernControlPanel 
            gameMode={gameMode}
            onGameModeChange={handleGameModeChange}
            whitePlayer={whitePlayer}
            blackPlayer={blackPlayer}
            onWhitePlayerChange={handleWhitePlayerChange}
            onBlackPlayerChange={handleBlackPlayerChange}
            onStartGame={handleStartGame}
            onResetGame={handleResetGame}
            isGameRunning={isGameRunning}
            isGameOver={gameState.gameOver}
            isThinking={isThinking || isAnalyzing || isStrategizing}
            currentTurn={gameState.turn}
            availableModels={availableModels}
            isLoadingModels={isLoadingModels}
          />
        </Box>
        
        {/* Main game area */}
        <Grid container spacing={2}>
          
          {/* Left side - Strategy panel (only in complex mode) */}
          {showStrategyColumns && (
            <Grid item xs={12} lg={3}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  White Strategy
                </Typography>
                
                {whiteMemory.opening && (
                  <Box mb={2}>
                    <Typography variant="subtitle2">Opening:</Typography>
                    <Chip 
                      label={whiteMemory.opening} 
                      color="primary" 
                      size="small"
                    />
                  </Box>
                )}
                
                {whiteMemory.moveEvaluations.length > 0 && gameState.turn !== 'w' && (
                  <Box mb={2}>
                    <Typography variant="subtitle2">Last Move:</Typography>
                    {whiteMemory.moveEvaluations.slice(-1).map((evaluation, idx) => (
                      <Box key={idx} sx={{ p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" fontWeight="bold">{evaluation.move}</Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ color: getScoreColor(evaluation.score) }}
                          >
                            {evaluation.score > 0 ? '+' : ''}{evaluation.score.toFixed(1)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {evaluation.reasoning}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {whiteMemory.shortTermGoals.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2">Goals:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {whiteMemory.shortTermGoals.slice(0, 3).map((goal, index) => (
                        <Chip 
                          key={index}
                          label={goal.length > 20 ? goal.substring(0, 20) + '...' : goal} 
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
          
          {/* Center - Chessboard area */}
          <Grid item xs={12} lg={showStrategyColumns ? 6 : 9}>
            <Stack spacing={2} alignItems="center">
              
              {/* Main chessboard with evaluation bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                
                {/* Evaluation bar on the left */}
                <EvaluationBar gameState={gameState} />
                
                {/* Chessboard - centered and prominent */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                  <Chessboard 
                    gameState={gameState} 
                    width={Math.min(560, window.innerWidth - 200)}
                    onBoardRef={handleBoardRef}
                    onHumanMove={handleHumanMove}
                    isHumanTurn={isHumanTurn()}
                    humanColor={getHumanColor() || 'white'}
                  />
                </Box>
              </Box>
              
              {/* Status indicators */}
              {(isAnalyzing || isStrategizing) && gameMode === 'ai-vs-ai-complex' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">
                    {isAnalyzing ? 'Analyzing position...' : 'Planning strategy...'}
                  </Typography>
                </Box>
              )}
              
              {isThinking && (gameMode === 'ai-vs-ai-simple' || gameMode.startsWith('human-vs-ai')) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">
                    AI is thinking...
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
          
          {/* Right side - Move history and analysis */}
          <Grid item xs={12} lg={showStrategyColumns ? 3 : 3}>
            <Stack spacing={2}>
              
              {/* Move history - compact */}
              <CompactMoveHistory moves={gameState.history} maxHeight={300} />
              
              {/* Current move analysis */}
              {currentMoveAnalysis && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Last Move Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {currentMoveAnalysis}
                  </Typography>
                </Paper>
              )}
              
              {/* Position analysis - only in complex mode */}
              {visionAnalysis && gameMode === 'ai-vs-ai-complex' && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Position Analysis</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                      {visionAnalysis}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>
          </Grid>
          
          {/* Black strategy panel (only in complex mode) */}
          {showStrategyColumns && (
            <Grid item xs={12} lg={3} sx={{ order: { xs: 1, lg: 0 } }}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Black Strategy
                </Typography>
                
                {blackMemory.opening && (
                  <Box mb={2}>
                    <Typography variant="subtitle2">Opening:</Typography>
                    <Chip 
                      label={blackMemory.opening} 
                      color="primary" 
                      size="small"
                    />
                  </Box>
                )}
                
                {blackMemory.moveEvaluations.length > 0 && gameState.turn !== 'b' && (
                  <Box mb={2}>
                    <Typography variant="subtitle2">Last Move:</Typography>
                    {blackMemory.moveEvaluations.slice(-1).map((evaluation, idx) => (
                      <Box key={idx} sx={{ p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" fontWeight="bold">{evaluation.move}</Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ color: getScoreColor(evaluation.score) }}
                          >
                            {evaluation.score > 0 ? '+' : ''}{evaluation.score.toFixed(1)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {evaluation.reasoning}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {blackMemory.shortTermGoals.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2">Goals:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {blackMemory.shortTermGoals.slice(0, 3).map((goal, index) => (
                        <Chip 
                          key={index}
                          label={goal.length > 20 ? goal.substring(0, 20) + '...' : goal} 
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default App; 