/**
 * AI Service - Advanced Chess AI Integration
 * 
 * This service provides sophisticated AI chess playing capabilities by integrating
 * with OpenAI's language models. It handles:
 * 
 * - Complex chess position analysis and move generation
 * - Strategic memory and long-term planning
 * - Integration with vision analysis for position understanding
 * - Support for multiple AI models including o-series models
 * - Fallback handling for robust gameplay
 * 
 * The service creates rich, contextual prompts that include:
 * - Current board position and game state
 * - Legal moves and chess guidelines
 * - Player's strategic memory and goals
 * - Position analysis from vision service
 * - Move evaluation and reasoning
 */Service - Advanced Chess AI Integration
 * 
 * Bu servis, OpenAI ve diğer büyük dil modelleriyle satranç oynayan gelişmiş bir AI sağlar.
 * - Karmaşık pozisyon analizi ve hamle üretimi
 * - Stratejik hafıza ve uzun vadeli planlama
 * - Vision analizi ile pozisyon değerlendirmesi
 * - Birden fazla AI modeli desteği
 * - Güçlü hata ve fallback yönetimi
 * 
 * Servis, aşağıdaki bilgileri içeren zengin ve bağlamsal istemler oluşturur:
 * - Mevcut tahta pozisyonu ve oyun durumu
 * - Legal hamleler ve satranç rehberleri
 * - Oyuncunun stratejik hafızası ve hedefleri
 * - Vision servisinden pozisyon analizi
 * - Hamle değerlendirmesi ve mantığı
 */

import axios from 'axios';
import OpenAI from 'openai';
import { AIModel, GameState, AIFunctionCallResponse, Move } from '../types';
import { chessService } from './chessService';
import { memoryService } from './memoryService';
import { strategyService } from './strategyService';

// Initialize OpenAI client with API key from environment variables
// Note: In production, this should be handled server-side for security
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo, in production this should be server-side
});

// Define API endpoints for different AI model providers (future extensibility)
const API_ENDPOINTS = {
  'gpt-3.5-turbo': '/api/openai',
  'gpt-4': '/api/openai',
  'claude-3-opus': '/api/anthropic',
  'claude-3-sonnet': '/api/anthropic'
};

/**
 * fetchAvailableModels
 * Fetches available AI models from OpenAI API and filters them for chess usage.
 * Returns only models suitable for chess playing.
 * @returns Promise<string[]> - Array of suitable model names
 */
const fetchAvailableModels = async (): Promise<string[]> => {
  try {
    const response = await openai.models.list();
    
    // Define patterns for models that are NOT suitable for chess playing
    const excludePatterns = [
      /embedding/i,           // Text embedding models (text-embedding-*)
      /whisper/i,            // Audio transcription models
      /tts-/i,               // Text-to-speech models
      /dall-e/i,             // Image generation models
      /moderation/i,         // Content moderation models
      /babbage|davinci|curie|ada/i,  // Legacy base models
      /^text-/i              // Legacy text completion models
    ];
    
    // Filter and sort available chat completion models
    const chatModels = response.data
      .filter(model => {
        // Exclude models that don't support chat completions
        return !excludePatterns.some(pattern => pattern.test(model.id));
      })
      .map(model => model.id)
      .sort(); // Alphabetical sorting for better user experience
    
    console.log(`✅ Found ${chatModels.length} potential chat completion models`);
    
    return chatModels;
  } catch (error) {
    console.error('Error fetching available models:', error);
    // Return comprehensive fallback set including latest models
    return [
      'gpt-4o',
      'gpt-4o-mini', 
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'o1',
      'o1-mini',
      'o3',
      'o3-mini',
      'o4-mini',
      'chatgpt-4o-latest'
    ];
  }
};

/**
 * createSystemMessage
 * Creates a comprehensive system message providing full context and chess knowledge to the AI.
 * Includes game state, legal moves, memory, vision analysis, and chess guidelines.
 * 
 * @param gameState - Current state of the chess game
 * @param playerColor - Color the AI is playing ('white' or 'black')
 * @param legalMoves - Array of all legal moves in current position
 * @param visionAnalysis - Optional position analysis from vision service
 * @param playerMemory - Formatted memory containing strategy and goals
 * @returns string - Complete system message for the AI
 */
const createSystemMessage = (
  gameState: GameState, 
  playerColor: 'white' | 'black', 
  legalMoves: Move[],
  visionAnalysis: string | null,
  playerMemory: string
) => {
  // Format legal moves in human-readable format for the AI
  const legalMovesFormatted = legalMoves.map(move => 
    `${move.from}->${move.to}${move.promotion ? `(promote to ${move.promotion})` : ''}`
  ).join(', ');
  
  // Provide context about the opponent's last move
  const lastMove = gameState.history.length > 0 ? gameState.history[gameState.history.length - 1] : null;
  const lastMoveText = lastMove ? 
    `Your opponent's last move was ${lastMove.san} (${lastMove.from} to ${lastMove.to}).` : 
    'You are making the first move of the game.';
  
  // Create detailed board representation with piece positions and coordinates
  const board = chessService.getBoardPosition();
  let piecePositions = '';
  
  // Convert board array to human-readable format
  for (let i = 0; i < board.length; i++) {
    const rank = 8 - i; // Chess ranks are numbered 8-1 from top to bottom
    let rankStr = `Rank ${rank}: `;
    
    for (let j = 0; j < board[i].length; j++) {
      const square = board[i][j];
      const file = String.fromCharCode(97 + j); // Convert to letters 'a'-'h'
      const squareNotation = `${file}${rank}`;
      
      if (square) {
        const pieceType = square.type.toUpperCase();
        const pieceColor = square.color === 'w' ? 'White' : 'Black';
        rankStr += `${squareNotation}:${pieceColor}${pieceType} `;
      }
    }
    
    piecePositions += rankStr + '\n';
  }
  
  // Include grandmaster-level position analysis if available
  const visionAnalysisSection = visionAnalysis ? 
    `\n\nGRANDMASTER ANALYSIS OF THE POSITION:\n${visionAnalysis}\n\n` : '';
  
  // Determine game phase and move count for contextual advice
  const moveCount = gameState.history.length;
  const moveNumber = Math.floor(moveCount / 2) + 1;
  let gamePhase = "opening";
  if (moveCount > 30) {
    gamePhase = "endgame";
  } else if (moveCount > 10) {
    gamePhase = "middlegame";
  }
  
  // Construct comprehensive system message with chess knowledge and context
  return `You are playing ${playerColor} in a chess game. Your goal is to win by checkmate. 
Your pieces are ${playerColor === 'white' ? 'white' : 'black'}.

GAME INFORMATION:
Move number: ${moveNumber}
Game phase: ${gamePhase}
Current position (FEN): ${gameState.fen}

${lastMoveText}

BOARD STATE (with coordinates):
${piecePositions}

${playerMemory}${visionAnalysisSection}

Your valid moves are: ${legalMovesFormatted}

CHESS GUIDELINES:
1. In the opening: develop your pieces, control the center, and castle early.
2. Don't bring your queen out too early without clear tactical advantage.
3. Knights before bishops is often a good development order.
4. Develop multiple pieces instead of moving the same piece repeatedly.
5. Look for tactical opportunities (forks, pins, skewers, discovered attacks).
6. Always consider your opponent's threats before executing your plan.
7. If you see a good move, look for a better one before deciding.

Before making your move, analyze the top 3 candidate moves with numerical ratings:
1. Assign each candidate a score from -10.0 to +10.0 where:
   - -10.0 to -5.0: Terrible move (blunder)
   - -5.0 to -2.0: Bad move (mistake)
   - -2.0 to -0.5: Slight inaccuracy
   - -0.5 to +0.5: Equal/neutral move
   - +0.5 to +2.0: Good move
   - +2.0 to +5.0: Very good move
   - +5.0 to +10.0: Excellent/winning move
2. For each candidate, provide brief tactical and strategic reasoning

Choose your final move based on your analysis, generally preferring the highest-rated option.

Make your move using the make_chess_move function with from and to coordinates.`;
};

/**
 * updatePlayerStrategy
 * Updates the AI player's strategic memory and goals before making a move.
 * This includes opening selection, short/long-term goals, and reflections.
 * 
 * @param gameState - Current game state
 * @param playerColor - Color of the player to update strategy for
 */
const updatePlayerStrategy = async (
  gameState: GameState,
  playerColor: 'white' | 'black'
): Promise<void> => {
  try {
    // Calculate move counts for strategy timing
    const moveCount = gameState.history.length;
    const playerMoveCount = Math.ceil(moveCount / 2);
    
    // Generate strategic plan using the strategy service
    const strategy = await strategyService.planStrategy(gameState, playerColor);
    
    // Update opening choice (primarily in early game)
    if (strategy.opening && (!memoryService.getMemory(playerColor).opening || moveCount < 10)) {
      memoryService.setOpening(playerColor, strategy.opening);
    }
    
    // Update short-term tactical goals
    if (strategy.shortTermGoals.length > 0) {
      memoryService.updateShortTermGoals(playerColor, strategy.shortTermGoals, playerMoveCount);
    }
    
    // Update long-term strategic objectives
    if (strategy.longTermGoals.length > 0) {
      memoryService.updateLongTermGoals(playerColor, strategy.longTermGoals, playerMoveCount);
    }
    
    // Add reflective thoughts about the position
    if (strategy.reflection) {
      memoryService.addReflection(playerColor, strategy.reflection);
    }
  } catch (error) {
    console.error('Error updating player strategy:', error);
  }
};

/**
 * fetchNextMove
 * Fetches the next move from AI for the current position.
 * Implements different paths for o-series and GPT-series models.
 * Provides fallback with random legal move on errors or invalid moves.
 * 
 * @param model - AI model to use for move generation
 * @param gameState - Current state of the chess game
 * @param playerColor - Color the AI is playing
 * @param visionAnalysis - Optional position analysis from vision service
 * @returns Promise with the chosen move and analysis
 */
const fetchNextMove = async (
  model: AIModel | string,
  gameState: GameState,
  playerColor: 'white' | 'black',
  visionAnalysis: string | null = null
): Promise<{ move: AIFunctionCallResponse, moveAnalysis: string }> => {
  try {
    // First, update the player's strategic memory and goals
    await updatePlayerStrategy(gameState, playerColor);
    
    // Get all legal moves available in the current position
    const legalMoves = chessService.getAllLegalMoves();
    
    // Format the player's memory for inclusion in the prompt
    const playerMemory = memoryService.formatMemoryForPrompt(playerColor);
    
    // Create comprehensive system message with full context
    const systemMessage = createSystemMessage(
      gameState, 
      playerColor, 
      legalMoves, 
      visionAnalysis,
      playerMemory
    );
    
    // Check if this is an o-series model (o1, o3, o4, etc.) which have different capabilities
    const isOSeriesModel = /^o\d/.test(model as string);
    
    // Prepare base parameters for the OpenAI API call
    const baseParams = {
      model: model as string,
      messages: [
        {
          role: "system" as const,
          content: systemMessage
        }
      ]
    };
    
    let response;
    
    if (isOSeriesModel) {
      // O-series models don't support function calling, so we need a different approach
      // Include move format instructions directly in the system message
      const oSeriesSystemMessage = systemMessage + `

IMPORTANT: You must respond with your move in this exact JSON format at the end of your response:
{"from": "e2", "to": "e4", "promotion": null}

Replace the from/to squares with your chosen move. Include promotion only if it's a pawn promotion (use "q", "r", "b", or "n").`;

      // Use max_completion_tokens instead of max_tokens for o-series models
      response = await openai.chat.completions.create({
        ...baseParams,
        messages: [
          {
            role: "system",
            content: oSeriesSystemMessage
          }
        ],
        max_completion_tokens: 1000  // O-series models use max_completion_tokens
      });
      
    } else {
      // Regular GPT models support function calling
      response = await openai.chat.completions.create({
        ...baseParams,
        functions: [
          {
            name: "make_chess_move",
            description: "Make a chess move",
            parameters: {
              type: "object",
              properties: {
                from: {
                  type: "string",
                  description: "The starting square in algebraic notation (e.g., 'e2')"
                },
                to: {
                  type: "string",
                  description: "The destination square in algebraic notation (e.g., 'e4')"
                },
                promotion: {
                  type: "string",
                  enum: ["q", "r", "b", "n"],
                  description: "The piece to promote to if this is a pawn promotion move. 'q' for queen, 'r' for rook, 'b' for bishop, 'n' for knight."
                }
              },
              required: ["from", "to"]
            }
          }
        ],
        function_call: { name: "make_chess_move" },
        max_tokens: 1000
      });
    }

    // Extract move analysis from content (if available)
    const moveAnalysis = response.choices[0]?.message?.content || "";
    let move: { from: string; to: string; promotion?: string } | null = null;

    if (isOSeriesModel) {
      // Parse JSON from o-series model response
      const content = response.choices[0]?.message?.content || "";
      
      // Look for JSON in the response
      const jsonMatch = content.match(/\{[^}]*"from"[^}]*\}/);
      if (jsonMatch) {
        try {
          move = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse o-series model JSON response:', e);
        }
      }
      
      // If JSON parsing failed, try to extract move with regex
      if (!move) {
        const fromMatch = content.match(/"from":\s*"([a-h][1-8])"/);
        const toMatch = content.match(/"to":\s*"([a-h][1-8])"/);
        const promotionMatch = content.match(/"promotion":\s*"([qrbn])"/);
        
        if (fromMatch && toMatch) {
          move = {
            from: fromMatch[1],
            to: toMatch[1],
            promotion: promotionMatch ? promotionMatch[1] : undefined
          };
        }
      }
      
    } else {
      // Parse function call response from regular GPT models
      if (response.choices[0]?.message?.function_call?.arguments) {
        const args = JSON.parse(response.choices[0].message.function_call.arguments);
        move = {
          from: args.from,
          to: args.to,
          promotion: args.promotion
        };
      }
    }
    
    // Validate the move
    if (move && move.from && move.to) {
      // Check if the move is legal
      const isLegalMove = legalMoves.some(legalMove => 
        legalMove.from === move!.from && 
        legalMove.to === move!.to &&
        (move!.promotion === legalMove.promotion || (!move!.promotion && !legalMove.promotion))
      );
      
      if (isLegalMove) {
        // Update memory with the move
        const moveObj: Move = {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          piece: 'unknown', // Will be replaced with actual piece later
          color: playerColor === 'white' ? 'w' : 'b',
          san: 'unknown', // Will be replaced with actual SAN later
          timestamp: Date.now()
        };
        
        memoryService.updateMoveHistory(playerColor, moveObj);
        return { move, moveAnalysis };
      } else {
        console.warn(`Model ${model} suggested illegal move: ${move.from} to ${move.to}`);
      }
    }
    
    // If we couldn't get a valid move from the API, pick a random legal move
    if (legalMoves.length > 0) {
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      memoryService.updateMoveHistory(playerColor, randomMove);
      return { 
        move: {
          from: randomMove.from,
          to: randomMove.to,
          promotion: randomMove.promotion
        },
        moveAnalysis: "Random move selected (fallback)."
      };
    }
    
    // This shouldn't happen if the game is still ongoing
    throw new Error('No legal moves available');
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    
    // Fallback to a random legal move
    const legalMoves = chessService.getAllLegalMoves();
    if (legalMoves.length > 0) {
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      memoryService.updateMoveHistory(playerColor, randomMove);
      return { 
        move: {
          from: randomMove.from,
          to: randomMove.to,
          promotion: randomMove.promotion
        },
        moveAnalysis: "Error occurred. Random move selected."
      };
    }
    
    throw error;
  }
};

// getNextMove: Wraps fetchNextMove function and provides error handling.
const getNextMove = async (
  model: AIModel | string,
  gameState: GameState,
  playerColor: 'white' | 'black',
  visionAnalysis: string | null = null
): Promise<{ move: AIFunctionCallResponse, moveAnalysis: string }> => {
  try {
    const result = await fetchNextMove(model, gameState, playerColor, visionAnalysis);
    return result;
  } catch (error) {
    console.error('Error getting next move from AI:', error);
    throw new Error('Failed to get next move from AI');
  }
};

// resetAI: Clears AI memory when the game is reset.
const resetAI = () => {
  memoryService.resetMemory();
};

export const aiService = {
  getNextMove,
  fetchAvailableModels,
  resetAI
};