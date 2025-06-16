/**
 * Memory Service - Strategic Memory Management for AI Players
 * 
 * This service manages the strategic memory and learning capabilities of AI chess players.
 * It tracks opening choices, short and long-term goals, move evaluations, and reflections
 * to provide context and continuity across moves in a chess game.
 * 
 * Key features:
 * - Opening strategy tracking and consistency
 * - Short-term and long-term goal management
 * - Move evaluation and reasoning storage
 * - Piece activity monitoring
 * - Reflective analysis capabilities
 * - Memory formatting for AI prompts
 */

import { Move } from '../types';

// Interface for storing move evaluations and AI reasoning
interface MoveEvaluation {
  move: string;           // Move in algebraic notation (e.g., "Nf3")
  score: number;          // Numerical evaluation (-10 to +10)
  reasoning: string;      // AI's reasoning for this evaluation
}

// Comprehensive memory structure for each AI player
interface ChessMemory {
  opening: string | null;                    // Chosen opening strategy name
  shortTermGoals: string[];                  // Current tactical objectives (1-3 moves)
  longTermGoals: string[];                   // Strategic objectives (5-10 moves)
  lastUpdatedShortTerm: number;              // Move number when short-term goals were last updated
  lastUpdatedLongTerm: number;               // Move number when long-term goals were last updated
  reflection: string[];                      // AI's self-analysis and thoughts
  moveHistory: Move[];                       // Complete history of moves made by this player
  pieceActivity: Record<string, number>;     // Track frequency of piece movements
  moveEvaluations: MoveEvaluation[];         // Stored evaluations of candidate moves
}

// Default memory state for new games
const initialMemory: ChessMemory = {
  opening: null,
  shortTermGoals: [],
  longTermGoals: [],
  lastUpdatedShortTerm: 0,
  lastUpdatedLongTerm: 0,
  reflection: [],
  moveHistory: [],
  pieceActivity: {},
  moveEvaluations: []
};

// Memory store for both players (white and black)
const memoryStore: Record<'white' | 'black', ChessMemory> = {
  white: { ...initialMemory },
  black: { ...initialMemory }
};

/**
 * Update move history and piece activity tracking
 * Called after each successful move to maintain accurate records
 * @param color - Player color ('white' or 'black')
 * @param move - Move object containing move details
 */
const updateMoveHistory = (color: 'white' | 'black', move: Move) => {
  memoryStore[color].moveHistory.push(move);
  
  // Track piece activity for pattern analysis
  const pieceId = `${move.piece}${move.from}`;
  memoryStore[color].pieceActivity[pieceId] = (memoryStore[color].pieceActivity[pieceId] || 0) + 1;
};

/**
 * Set the opening strategy for consistent play
 * Extracts and stores the primary opening name from strategy descriptions
 * @param color - Player color
 * @param opening - Opening name or description
 */
const setOpening = (color: 'white' | 'black', opening: string) => {
  // Extract just the opening name if it's a longer description
  const openingName = opening.split(/[.,:]/)[0].trim();
  memoryStore[color].opening = openingName;
};

/**
 * Update short-term tactical goals
 * These are immediate objectives typically spanning 1-3 moves
 * @param color - Player color
 * @param goals - Array of goal descriptions
 * @param moveNumber - Current move number for tracking updates
 */
const updateShortTermGoals = (color: 'white' | 'black', goals: string[], moveNumber: number) => {
  // Limit to 3 goals to maintain focus
  memoryStore[color].shortTermGoals = goals.slice(0, 3);
  memoryStore[color].lastUpdatedShortTerm = moveNumber;
};

/**
 * Update long-term strategic goals
 * These are broader objectives spanning 5-10 moves or more
 * @param color - Player color
 * @param goals - Array of strategic goal descriptions
 * @param moveNumber - Current move number for tracking updates
 */
const updateLongTermGoals = (color: 'white' | 'black', goals: string[], moveNumber: number) => {
  // Limit to 3 goals to maintain strategic focus
  memoryStore[color].longTermGoals = goals.slice(0, 3);
  memoryStore[color].lastUpdatedLongTerm = moveNumber;
};

/**
 * Add reflective analysis from the AI
 * Stores the AI's self-analysis and strategic thinking
 * @param color - Player color
 * @param reflection - AI's reflective thoughts about the position
 */
const addReflection = (color: 'white' | 'black', reflection: string) => {
  memoryStore[color].reflection.push(reflection);
  
  // Keep only the last 5 reflections to avoid memory bloat
  if (memoryStore[color].reflection.length > 5) {
    memoryStore[color].reflection.shift();
  }
};

/**
 * Check if it's time to update short-term goals
 * Typically called before a player's turn to decide on goal updates
 * @param color - Player color
 * @param currentMoveNumber - The current move number in the game
 * @returns boolean - True if short-term goals should be updated
 */
const shouldUpdateShortTermGoals = (color: 'white' | 'black', currentMoveNumber: number): boolean => {
  return currentMoveNumber - memoryStore[color].lastUpdatedShortTerm >= 3;
};

/**
 * Check if it's time to update long-term goals
 * Typically called before a player's turn to decide on goal updates
 * @param color - Player color
 * @param currentMoveNumber - The current move number in the game
 * @returns boolean - True if long-term goals should be updated
 */
const shouldUpdateLongTermGoals = (color: 'white' | 'black', currentMoveNumber: number): boolean => {
  return currentMoveNumber - memoryStore[color].lastUpdatedLongTerm >= 6;
};

/**
 * Get the current memory state for a player
 * @param color - Player color
 * @returns ChessMemory - The current memory object for the player
 */
const getMemory = (color: 'white' | 'black'): ChessMemory => {
  return memoryStore[color];
};

/**
 * Store move evaluations for the player
 * @param color - Player color
 * @param evaluations - Array of move evaluations to store
 */
const storeMoveEvaluations = (color: 'white' | 'black', evaluations: MoveEvaluation[]) => {
  memoryStore[color].moveEvaluations = evaluations.slice(0, 3); // Store top 3 evaluations
};

/**
 * Get move evaluations for the player
 * @param color - Player color
 * @returns MoveEvaluation[] - Array of stored move evaluations
 */
const getMoveEvaluations = (color: 'white' | 'black'): MoveEvaluation[] => {
  return memoryStore[color].moveEvaluations;
};

/**
 * Parse move evaluations from AI response content
 * Extracts move evaluations using regex from the AI's textual response
 * @param content - The AI's response content as a string
 * @returns MoveEvaluation[] - Array of parsed move evaluations
 */
const parseMoveEvaluations = (content: string): MoveEvaluation[] => {
  const evaluations: MoveEvaluation[] = [];
  
  // Regular expression to find move evaluations in the format
  // Move from-to: +/-N.N - reasoning
  const moveRegex = /([a-h][1-8][- ]?to[- ]?[a-h][1-8]|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:\=[QRBN])?[+#]?)\s*[:]\s*([\+\-]?\d+\.?\d*)\s*[-:]\s*(.+?)(?=\n\s*\d+\.|\n\s*(?:[a-h][1-8]|[KQRBN])|$)/gi;
  
  let match;
  while ((match = moveRegex.exec(content)) !== null) {
    if (match.length >= 4) {
      evaluations.push({
        move: match[1].trim(),
        score: parseFloat(match[2].trim()),
        reasoning: match[3].trim()
      });
    }
  }
  
  // If no matches found with the specific format, try a more general regex
  if (evaluations.length === 0) {
    const generalRegex = /(?:Option|Move|Candidate)\s*(?:\d+)?\s*[.:]\s*([a-h][1-8][- ]?to[- ]?[a-h][1-8]|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:\=[QRBN])?[+#]?)\s*(?:[-,]|with score)\s*([\+\-]?\d+\.?\d*)\s*[-:]\s*(.+?)(?=\n|$)/gi;
    
    while ((match = generalRegex.exec(content)) !== null) {
      if (match.length >= 4) {
        evaluations.push({
          move: match[1].trim(),
          score: parseFloat(match[2].trim()),
          reasoning: match[3].trim()
        });
      }
    }
  }
  
  // Sort by score (highest first)
  return evaluations.sort((a, b) => b.score - a.score);
};

/**
 * Reset memory for both players
 * Clears all stored data and starts a new game session
 */
const resetMemory = () => {
  memoryStore.white = { ...initialMemory };
  memoryStore.black = { ...initialMemory };
};

/**
 * Format memory as a string for the AI prompt
 * Compiles the relevant memory aspects into a structured string
 * @param color - Player color
 * @returns string - Formatted memory string
 */
const formatMemoryForPrompt = (color: 'white' | 'black'): string => {
  const memory = memoryStore[color];
  
  let memoryString = "MEMORY:\n";
  
  // Opening strategy
  if (memory.opening) {
    memoryString += `Opening Strategy: ${memory.opening}\n`;
  }
  
  // Short-term goals
  if (memory.shortTermGoals.length > 0) {
    memoryString += "Short-term Goals (next 1-4 moves):\n";
    memory.shortTermGoals.forEach((goal, index) => {
      memoryString += `- ${goal}\n`;
    });
  }
  
  // Long-term goals
  if (memory.longTermGoals.length > 0) {
    memoryString += "Long-term Goals (next 5-10 moves):\n";
    memory.longTermGoals.forEach((goal, index) => {
      memoryString += `- ${goal}\n`;
    });
  }
  
  // Previous reflections
  if (memory.reflection.length > 0) {
    memoryString += "Previous Reflections:\n";
    memory.reflection.slice(-3).forEach((reflection, index) => {
      memoryString += `- ${reflection}\n`;
    });
  }
  
  // Piece activity insights
  const overusedPieces = Object.entries(memory.pieceActivity)
    .filter(([_, count]) => count > 3)
    .map(([pieceId]) => pieceId);
  
  if (overusedPieces.length > 0) {
    memoryString += "Piece Usage Note: You may be overusing ";
    memoryString += overusedPieces.map(p => p.charAt(0)).join(', ');
    memoryString += ". Consider developing other pieces.\n";
  }
  
  return memoryString;
};

export const memoryService = {
  updateMoveHistory,
  setOpening,
  updateShortTermGoals,
  updateLongTermGoals,
  addReflection,
  shouldUpdateShortTermGoals,
  shouldUpdateLongTermGoals,
  getMemory,
  resetMemory,
  formatMemoryForPrompt,
  storeMoveEvaluations,
  getMoveEvaluations,
  parseMoveEvaluations
};