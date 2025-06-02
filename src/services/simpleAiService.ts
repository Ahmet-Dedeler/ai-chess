import OpenAI from 'openai';
import { AIModel, GameState, AIFunctionCallResponse } from '../types';
import { chessService } from './chessService';

// Initialize OpenAI with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo, in production this should be server-side
});

// System prompt for the simple chess AI
const SIMPLE_SYSTEM_PROMPT = `You are a chess grandmaster.
You will be given a partially completed game.
After seeing it, you should repeat the ENTIRE GAME and then give ONE new move.
Use standard algebraic notation, e.g. "e4" or "Rdf8" or "R1a3".
ALWAYS repeat the entire representation of the game so far.
NEVER explain your choice.`;

// Static examples to demonstrate the expected format
const STATIC_EXAMPLES = [
  {
    role: "user" as const,
    content: "1."
  },
  {
    role: "assistant" as const,
    content: "1. e4"
  },
  {
    role: "user" as const,
    content: "1. d4"
  },
  {
    role: "assistant" as const,
    content: "1. d4 d5"
  },
  {
    role: "user" as const,
    content: "1. e4 e5 2. Nf3 Nc6 3."
  },
  {
    role: "assistant" as const,
    content: "1. e4 e5 2. Nf3 Nc6 3. Bb5"
  }
];

// Format the current game state as a PGN-style prompt
const formatGameForPrompt = (gameState: GameState): string => {
  // Create a header similar to PGN format
  const header = `[Event "Shamkir Chess"]
[White "Anand, Viswanathan"]
[Black "Topalov, Veselin"]
[Result "1-0"]
[WhiteElo "2779"]
[BlackElo "2740"]

`;

  // Get the PGN notation of the game
  let pgn = gameState.pgn;
  
  // If game just started, return the move number
  if (!pgn || pgn.trim() === '') {
    return header + "1.";
  }
  
  // Add the move number continuation
  const moveCount = gameState.history.length;
  const isWhiteTurn = gameState.turn === 'w';
  
  if (isWhiteTurn) {
    const moveNumber = Math.floor(moveCount / 2) + 1;
    pgn += ` ${moveNumber}.`;
  } else {
    // If it's black's turn and we don't end with a move number, add space
    if (!pgn.trim().endsWith('.')) {
      pgn += '';
    }
  }
  
  return header + pgn;
};

// Extract the last move from the AI response
const extractMoveFromResponse = (response: string, gameState: GameState): AIFunctionCallResponse | null => {
  try {
    // Remove header lines that start with [
    const lines = response.split('\n');
    const gameLines = lines.filter(line => !line.trim().startsWith('[') && line.trim() !== '');
    const gameText = gameLines.join(' ').trim();
    
    if (!gameText) {
      return null;
    }
    
    // Split by move numbers and periods to get individual moves
    const movePattern = /\d+\.\s*/g;
    const parts = gameText.split(movePattern).filter(part => part.trim() !== '');
    
    if (parts.length === 0) {
      return null;
    }
    
    // Get the last part which should contain the most recent moves
    const lastPart = parts[parts.length - 1].trim();
    
    // Split by spaces to get individual moves
    const moves = lastPart.split(/\s+/).filter(move => move.trim() !== '');
    
    if (moves.length === 0) {
      return null;
    }
    
    // Get the last move
    let lastMove = moves[moves.length - 1].trim();
    
    // Clean up the move (remove extra characters like periods, etc.)
    lastMove = lastMove.replace(/[.+#!?]+$/, '');
    
    // Validate the move format (basic check)
    if (!/^[KQRNB]?[a-h]?[1-8]?[x]?[a-h][1-8](?:[=][QRNB])?[+#]?$/.test(lastMove) && 
        !/^O-O-?O?$/.test(lastMove)) {
      return null;
    }
    
    // Convert algebraic notation to from/to format using chess service
    const legalMoves = chessService.getAllLegalMoves();
    
    // Find the legal move that matches this algebraic notation
    const matchingMove = legalMoves.find(move => move.san === lastMove);
    
    if (matchingMove) {
      return {
        from: matchingMove.from,
        to: matchingMove.to,
        promotion: matchingMove.promotion
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting move from response:', error);
    return null;
  }
};

// Get the next move from the AI using text-based prompting
const fetchNextMoveSimple = async (
  model: AIModel | string,
  gameState: GameState,
  playerColor: 'white' | 'black'
): Promise<{ move: AIFunctionCallResponse, moveAnalysis: string }> => {
  const maxRetries = 3;
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 AI Move Attempt ${attempt}/${maxRetries} (${model} as ${playerColor})`);
      
      // Get all legal moves for validation
      const legalMoves = chessService.getAllLegalMoves();
      
      if (legalMoves.length === 0) {
        throw new Error('No legal moves available');
      }

      console.log(`📋 Available legal moves: ${legalMoves.map(m => m.san).join(', ')}`);

      // Format the current game state
      const gamePrompt = formatGameForPrompt(gameState);
      console.log(`📝 Game prompt sent to AI:\n${gamePrompt}`);
      
      // Build the conversation with static examples
      const messages = [
        {
          role: "system" as const,
          content: SIMPLE_SYSTEM_PROMPT
        },
        ...STATIC_EXAMPLES,
        {
          role: "user" as const,
          content: gamePrompt
        }
      ];

      // Make the API call to OpenAI
      const response = await openai.chat.completions.create({
        model: model as string,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      console.log(`🤖 AI Raw Response:\n${aiResponse}`);
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Extract the move from the response
      const move = extractMoveFromResponse(aiResponse, gameState);
      
      if (!move) {
        lastError = 'Could not extract valid move from AI response';
        console.error(`❌ ${lastError}`);
        console.log(`🔍 Response parsing failed. Raw response was: "${aiResponse}"`);
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying... (attempt ${attempt + 1}/${maxRetries})`);
          continue;
        }
        throw new Error(lastError);
      }

      console.log(`✅ Extracted move: ${move.from} -> ${move.to}${move.promotion ? ` (=${move.promotion})` : ''}`);

      // Validate that this is a legal move
      const isLegalMove = legalMoves.some(legalMove => 
        legalMove.from === move.from && 
        legalMove.to === move.to && 
        (move.promotion ? legalMove.promotion === move.promotion : !legalMove.promotion)
      );

      if (!isLegalMove) {
        lastError = `Extracted move ${move.from}-${move.to}${move.promotion ? ` (=${move.promotion})` : ''} is not legal`;
        console.error(`❌ ${lastError}`);
        console.log(`🔍 Legal moves from ${move.from}: ${legalMoves.filter(m => m.from === move.from).map(m => m.to).join(', ')}`);
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying... (attempt ${attempt + 1}/${maxRetries})`);
          continue;
        }
        throw new Error(lastError);
      }

      // Find the matching legal move to get the SAN notation
      const matchingLegalMove = legalMoves.find(legalMove => 
        legalMove.from === move.from && 
        legalMove.to === move.to && 
        (move.promotion ? legalMove.promotion === move.promotion : !legalMove.promotion)
      );

      console.log(`✨ Valid move confirmed: ${matchingLegalMove?.san} (${move.from}-${move.to})`);

      // Simple move analysis
      const moveAnalysis = `${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} plays ${matchingLegalMove?.san || `${move.from}-${move.to}`}${move.promotion ? ` (promotes to ${move.promotion.toUpperCase()})` : ''}`;

      return {
        move,
        moveAnalysis
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ AI Move Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error(`💥 All ${maxRetries} attempts failed. Last error: ${lastError}`);
        break;
      }
    }
  }
  
  // Fallback to a random legal move if AI fails after all retries
  console.log('🎲 Falling back to random legal move...');
  const legalMoves = chessService.getAllLegalMoves();
  if (legalMoves.length > 0) {
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    console.log(`🎯 Random fallback move selected: ${randomMove.san} (${randomMove.from}-${randomMove.to})`);
    
    return {
      move: {
        from: randomMove.from,
        to: randomMove.to,
        promotion: randomMove.promotion
      },
      moveAnalysis: `⚠️ AI failed after ${maxRetries} attempts (${lastError}). Fallback random move: ${randomMove.san}`
    };
  }
  
  throw new Error('No legal moves available and AI failed to respond');
};

// Export the simple AI service
export const simpleAiService = {
  fetchNextMove: fetchNextMoveSimple
}; 