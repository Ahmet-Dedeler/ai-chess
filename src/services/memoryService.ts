import { Move } from '../types';

interface MoveEvaluation {
  move: string;
  score: number;
  reasoning: string;
}

interface ChessMemory {
  opening: string | null;
  shortTermGoals: string[];
  longTermGoals: string[];
  lastUpdatedShortTerm: number; // Move number
  lastUpdatedLongTerm: number; // Move number
  reflection: string[];
  moveHistory: Move[];
  pieceActivity: Record<string, number>; // Track how often pieces are moved
  moveEvaluations: MoveEvaluation[]; // Store evaluations of considered moves
}

// Initialize memory for each player
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

// Memory store for both players
const memoryStore: Record<'white' | 'black', ChessMemory> = {
  white: { ...initialMemory },
  black: { ...initialMemory }
};

// Update memory with a new move
const updateMoveHistory = (color: 'white' | 'black', move: Move) => {
  memoryStore[color].moveHistory.push(move);
  
  // Update piece activity
  const pieceId = `${move.piece}${move.from}`;
  memoryStore[color].pieceActivity[pieceId] = (memoryStore[color].pieceActivity[pieceId] || 0) + 1;
};

// Set the opening strategy (just the name)
const setOpening = (color: 'white' | 'black', opening: string) => {
  // Extract just the opening name if it's a longer description
  const openingName = opening.split(/[.,:]/)[0].trim();
  memoryStore[color].opening = openingName;
};

// Update short-term goals (typically every 3 moves)
const updateShortTermGoals = (color: 'white' | 'black', goals: string[], moveNumber: number) => {
  // Limit to 3 goals
  memoryStore[color].shortTermGoals = goals.slice(0, 3);
  memoryStore[color].lastUpdatedShortTerm = moveNumber;
};

// Update long-term goals (typically every 6 moves)
const updateLongTermGoals = (color: 'white' | 'black', goals: string[], moveNumber: number) => {
  // Limit to 3 goals
  memoryStore[color].longTermGoals = goals.slice(0, 3);
  memoryStore[color].lastUpdatedLongTerm = moveNumber;
};

// Add reflection (AI's self-talk)
const addReflection = (color: 'white' | 'black', reflection: string) => {
  memoryStore[color].reflection.push(reflection);
  
  // Keep only the last 5 reflections
  if (memoryStore[color].reflection.length > 5) {
    memoryStore[color].reflection.shift();
  }
};

// Check if it's time to update short-term goals
const shouldUpdateShortTermGoals = (color: 'white' | 'black', currentMoveNumber: number): boolean => {
  return currentMoveNumber - memoryStore[color].lastUpdatedShortTerm >= 3;
};

// Check if it's time to update long-term goals
const shouldUpdateLongTermGoals = (color: 'white' | 'black', currentMoveNumber: number): boolean => {
  return currentMoveNumber - memoryStore[color].lastUpdatedLongTerm >= 6;
};

// Get current memory state
const getMemory = (color: 'white' | 'black'): ChessMemory => {
  return memoryStore[color];
};

// Store move evaluations for the player
const storeMoveEvaluations = (color: 'white' | 'black', evaluations: MoveEvaluation[]) => {
  memoryStore[color].moveEvaluations = evaluations.slice(0, 3); // Store top 3 evaluations
};

// Get move evaluations
const getMoveEvaluations = (color: 'white' | 'black'): MoveEvaluation[] => {
  return memoryStore[color].moveEvaluations;
};

// Parse move evaluations from AI response
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

// Reset memory
const resetMemory = () => {
  memoryStore.white = { ...initialMemory };
  memoryStore.black = { ...initialMemory };
};

// Format memory as a string for the AI prompt
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