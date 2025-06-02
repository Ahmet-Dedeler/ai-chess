import OpenAI from 'openai';
import { GameState, Move } from '../types';
import { memoryService } from './memoryService';

// Initialize OpenAI with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo, in production this should be server-side
});

// Parse AI's response to extract goals and reflections
const parseStrategyResponse = (response: string): {
  opening?: string;
  shortTermGoals: string[];
  longTermGoals: string[];
  reflection: string;
} => {
  const result = {
    shortTermGoals: [],
    longTermGoals: [],
    reflection: ""
  } as {
    opening?: string;
    shortTermGoals: string[];
    longTermGoals: string[];
    reflection: string;
  };

  // Extract opening
  const openingMatch = response.match(/Opening Strategy:\s*(.*?)(?:\n|$)/i);
  if (openingMatch && openingMatch[1]) {
    result.opening = openingMatch[1].trim();
  }

  // Extract short-term goals
  const shortTermSection = response.match(/Short-term Goals \(next 1-4 moves\):([\s\S]*?)(?=Long-term Goals|Reflection:|$)/i);
  if (shortTermSection && shortTermSection[1]) {
    result.shortTermGoals = shortTermSection[1]
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line);
  }

  // Extract long-term goals
  const longTermSection = response.match(/Long-term Goals \(next 5-10 moves\):([\s\S]*?)(?=Reflection:|$)/i);
  if (longTermSection && longTermSection[1]) {
    result.longTermGoals = longTermSection[1]
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line);
  }

  // Extract reflection
  const reflectionSection = response.match(/Reflection:([\s\S]*?)$/i);
  if (reflectionSection && reflectionSection[1]) {
    result.reflection = reflectionSection[1].trim();
  }

  return result;
};

// Create prompt for strategy planning
const createStrategyPrompt = (
  gameState: GameState,
  playerColor: 'white' | 'black',
  isOpeningPhase: boolean,
  shouldUpdateShortTerm: boolean,
  shouldUpdateLongTerm: boolean
): string => {
  const currentMemory = memoryService.getMemory(playerColor);
  const moveCount = gameState.history.length;
  const isFirstMove = moveCount === 0 || (moveCount === 1 && playerColor === 'black');

  let prompt = `You are a chess Grandmaster planning your strategy as ${playerColor}. `;

  if (isFirstMove) {
    prompt += `This is your first move. Choose an opening strategy and initial development plan.`;
  } else {
    prompt += `The game has progressed to move ${Math.floor(moveCount / 2) + 1}.`;
  }

  prompt += `\n\nCurrent board position (FEN): ${gameState.fen}\n`;

  // Add memory of previous plans if available
  if (currentMemory.opening || currentMemory.shortTermGoals.length > 0 || currentMemory.longTermGoals.length > 0) {
    prompt += "\nYour current strategy:\n";
    if (currentMemory.opening) {
      prompt += `Opening Strategy: ${currentMemory.opening}\n`;
    }
    
    if (currentMemory.shortTermGoals.length > 0) {
      prompt += "Short-term Goals (next 1-4 moves):\n";
      currentMemory.shortTermGoals.forEach(goal => {
        prompt += `- ${goal}\n`;
      });
    }
    
    if (currentMemory.longTermGoals.length > 0) {
      prompt += "Long-term Goals (next 5-10 moves):\n";
      currentMemory.longTermGoals.forEach(goal => {
        prompt += `- ${goal}\n`;
      });
    }
  }

  // Request specific planning based on game state
  prompt += "\n\nPlease provide the following:";

  if (isFirstMove || isOpeningPhase) {
    prompt += "\n\nOpening Strategy: Name a specific recognized chess opening (like Sicilian Defense, Queen's Gambit, etc.) you'll follow.";
  }

  if (shouldUpdateShortTerm || isFirstMove) {
    prompt += "\n\nShort-term Goals (next 1-4 moves): List exactly 3 concrete tactical objectives with specific pieces and squares when possible.";
  }

  if (shouldUpdateLongTerm || isFirstMove) {
    prompt += "\n\nLong-term Goals (next 5-10 moves): List exactly 3 strategic positional objectives.";
  }

  prompt += "\n\nReflection: Briefly analyze the current position, any immediate threats or opportunities, and how your plan addresses them.";

  prompt += `\n\nRemember:
1. Short-term goals should be concrete and actionable in the next few moves (e.g., "Develop knight to f3 to control e5").
2. Long-term goals should be strategic (e.g., "Create a pawn majority on the queenside").
3. If you've committed to an opening, stay consistent with it unless forced to deviate.
4. Prioritize piece development and king safety in the opening.
5. Don't move the same piece repeatedly unless tactically necessary.`;

  return prompt;
};

// Plan strategy (opening, short and long-term goals)
const planStrategy = async (
  gameState: GameState,
  playerColor: 'white' | 'black'
): Promise<{
  opening?: string;
  shortTermGoals: string[];
  longTermGoals: string[];
  reflection: string;
}> => {
  try {
    const moveCount = gameState.history.length;
    const playerMoveCount = Math.ceil(moveCount / 2);
    
    // Determine if we're still in opening phase (first 10 moves)
    const isOpeningPhase = moveCount < 20;
    
    // Check if we should update short-term and long-term goals
    const shouldUpdateShortTerm = memoryService.shouldUpdateShortTermGoals(playerColor, playerMoveCount);
    const shouldUpdateLongTerm = memoryService.shouldUpdateLongTermGoals(playerColor, playerMoveCount);
    
    // Create the strategy prompt
    const prompt = createStrategyPrompt(
      gameState,
      playerColor,
      isOpeningPhase,
      shouldUpdateShortTerm,
      shouldUpdateLongTerm
    );
    
    // Call the OpenAI API for strategic planning
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a chess Grandmaster providing strategic planning and self-reflection for a chess player."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
    });
    
    // Parse the response
    const content = response.choices[0]?.message?.content || "";
    return parseStrategyResponse(content);
  } catch (error) {
    console.error("Error in strategy planning:", error);
    return {
      shortTermGoals: [],
      longTermGoals: [],
      reflection: "Error in strategic planning. Proceeding with existing strategy."
    };
  }
};

export const strategyService = {
  planStrategy
}; 