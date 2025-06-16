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

// Create a clean, modern theme. 
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Indigo-500
    },
    secondary: {
      main: '#f472b6', // Pink-400
    },
    background: {
      default: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
      paper: 'rgba(255,255,255,0.85)',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h5: {
      fontWeight: 800,
      letterSpacing: '-1px',
    },
    h6: {
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
    },
    body2: {
      fontSize: '1rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
          backdropFilter: 'blur(6px)',
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          margin: '8px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 12,
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
          borderRadius: 8,
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
        }
      }
    },
  }
});

// Helper function to convert move evaluation score to Rating component value
// TODO: This function is currently unused. Consider removing or implementing it.
const scoreToRating = (score: number): number => {
  const rating = (score + 10) / 4;
  return Math.max(0, Math.min(5, rating));
};

// Helper function to get color based on score for UI elements
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
  // Game state: Stores the current state of the chess game (FEN, history, turn, etc.)
  const [gameState, setGameState] = useState<GameState>(chessService.getGameState());
  
  // Game mode: Determines the type of game (e.g., AI vs AI, Human vs AI)
  const [gameMode, setGameMode] = useState<GameMode>('ai-vs-ai-simple');
  
  // Available models: Stores the list of AI models fetched from the backend/service
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  // isLoadingModels: Flag to indicate if AI models are currently being fetched
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  
  // Game settings: Configuration for the white player (type, AI model)
  const [whitePlayer, setWhitePlayer] = useState<PlayerConfig>({
    color: 'white',
    type: 'ai',
    model: ''
  });
  
  // Game settings: Configuration for the black player (type, AI model)
  const [blackPlayer, setBlackPlayer] = useState<PlayerConfig>({
    color: 'black',
    type: 'ai',
    model: ''
  });
  
  // Game control flags
  // isGameRunning: Indicates if a game is currently in progress
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  // isThinking: Flag to show loading/thinking indicator for AI moves
  const [isThinking, setIsThinking] = useState<boolean>(false);
  // isAnalyzing: Flag for when AI is performing deeper position analysis (complex mode)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  // isStrategizing: Flag for when AI is planning long-term strategy (complex mode)
  const [isStrategizing, setIsStrategizing] = useState<boolean>(false);
  // visionAnalysis: Stores the output of AI\'s visual analysis of the board (complex mode)
  const [visionAnalysis, setVisionAnalysis] = useState<string | null>(null);
  // currentMoveAnalysis: Stores the AI\'s analysis of the most recent move
  const [currentMoveAnalysis, setCurrentMoveAnalysis] = useState<string>('');
  
  // Board element reference: Used for functionalities like capturing board image
  const boardRef = useRef<HTMLElement | null>(null);

  // Callback to set the boardRef when the Chessboard component mounts
  const handleBoardRef = (ref: HTMLElement | null) => {
    boardRef.current = ref;
  };

  // Fetch available AI models when the component mounts
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
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler for white player configuration changes from the control panel
  const handleWhitePlayerChange = (config: PlayerConfig) => {
    setWhitePlayer(config);
  };

  // Handler for black player configuration changes from the control panel
  const handleBlackPlayerChange = (config: PlayerConfig) => {
    setBlackPlayer(config);
  };

  // Starts the game
  const handleStartGame = () => {
    setIsGameRunning(true);
  };

  // Resets the game to its initial state
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

  // Gets the current player configuration based on whose turn it is
  const getCurrentPlayer = useCallback(() => {
    return gameState.turn === 'w' ? whitePlayer : blackPlayer;
  }, [gameState.turn, whitePlayer, blackPlayer]);

  // Checks if it\'s currently a human player\'s turn
  const isHumanTurn = useCallback(() => {
    if (!gameMode.startsWith('human-vs-ai')) return false;
    const currentPlayer = getCurrentPlayer();
    return currentPlayer.type === 'human';
  }, [gameMode, getCurrentPlayer]);

  // Gets the color of the human player in \'human-vs-ai\' mode
  const getHumanColor = useCallback((): 'white' | 'black' | null => {
    if (!gameMode.startsWith('human-vs-ai')) return null;
    return whitePlayer.type === 'human' ? 'white' : 'black';
  }, [gameMode, whitePlayer.type]);

  // Handles moves made by a human player
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

  // AI game loop: This effect runs when it\'s an AI\'s turn to make a move
  useEffect(() => {
    // Conditions to prevent AI move: game not running, game over, or human\'s turn
    if (!isGameRunning || gameState.gameOver || isHumanTurn()) {
      return;
    }

    const makeAIMove = async () => {
      const currentPlayer = getCurrentPlayer();
      // Ensure current player is AI and has a model selected
      if (currentPlayer.type !== 'ai' || !currentPlayer.model) {
        console.error('❌ Current player is not AI or has no model');
        return;
      }

      setIsThinking(true);
      
      try {
        let moveResult;
        
        // Select AI service based on game mode (simple or complex)
        if (gameMode === 'ai-vs-ai-simple' || gameMode === 'human-vs-ai-simple') {
          moveResult = await simpleAiService.fetchNextMove(
            currentPlayer.model as AIModel,
            gameState,
            currentPlayer.color
          );
        } else {
          // Complex modes use the advanced aiService with vision/strategy
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
            
            // Update UI with AI\'s analysis of its move
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

    // Debounce AI move to allow UI updates and a more natural game flow
    const timeoutId = setTimeout(makeAIMove, 1000);
    // Cleanup function to clear timeout if dependencies change or component unmounts
    return () => clearTimeout(timeoutId);
  }, [gameState, isGameRunning, getCurrentPlayer, isHumanTurn, gameMode, visionAnalysis]); // Added gameState to dependencies

  // Handles changes to the game mode selection
  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode);
  };

  // Retrieves strategic memory information for a given player color
  const getMemoryInfo = (color: 'white' | 'black') => {
    return memoryService.getMemory(color);
  };

  // Memoized memory info for white and black players
  const whiteMemory = getMemoryInfo('white');
  const blackMemory = getMemoryInfo('black');
  // Determines if strategy columns should be visible (only in complex AI vs AI mode)
  const showStrategyColumns = gameMode === 'ai-vs-ai-complex' && isGameRunning;

  // Cleanup Stockfish service on component unmount to free resources
  useEffect(() => {
    return () => {
      stockfishService.destroy();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Main application container with modern styling */}
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', borderRadius: 6, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}>
        
        {/* Application Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 900, color: '#3730a3', letterSpacing: '-2px', mb: 1, textShadow: '0 2px 8px #e0e7ff' }}>
            AI Chess Battle
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#6366f1', fontWeight: 500 }}>
            Modern AI Satranç Deneyimi
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
          
          {/* Left Strategy Panel (White): Visible in complex AI vs AI mode */}
          {showStrategyColumns && (
            <Grid item xs={12} lg={3}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  White Strategy
                </Typography>
                
                {/* Display White\'s opening choice */}
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
                
                {/* Display White\'s evaluation of its last move */}
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
                
                {/* Display White\'s short-term goals */}
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
          
          {/* Center Area: Chessboard and status indicators */}
          <Grid item xs={12} lg={showStrategyColumns ? 6 : 9}>
            <Stack spacing={2} alignItems="center">
              
              {/* Chessboard and Evaluation Bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                
                {/* Evaluation Bar: Shows real-time Stockfish evaluation */}
                <EvaluationBar gameState={gameState} />
                
                {/* Chessboard Component */}
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
              
              {/* Status Indicators: Shows when AI is thinking, analyzing, or strategizing */}
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
          
          {/* Right Panel: Move History and Analysis */}
          <Grid item xs={12} lg={showStrategyColumns ? 3 : 3}>
            <Stack spacing={2}>
              
              {/* Compact Move History Component */}
              <CompactMoveHistory moves={gameState.history} maxHeight={300} />
              
              {/* Current Move Analysis Display */}
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
              
              {/* Position Analysis Display (Complex Mode Only) */}
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
          
          {/* Black Strategy Panel: Visible in complex AI vs AI mode, appears on the right */}
          {showStrategyColumns && (
            <Grid item xs={12} lg={3} sx={{ order: { xs: 1, lg: 0 } }}> {/* Order ensures it appears after center on small screens */}
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Black Strategy
                </Typography>
                
                {/* Display Black\'s opening choice */}
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
                
                {/* Display Black\'s evaluation of its last move */}
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
                
                {/* Display Black\'s short-term goals */}
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