import OpenAI from 'openai';
import { GameState, Move } from '../types';

// Initialize OpenAI with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo, in production this should be server-side
});

// Create the prompt for vision analysis
const createVisionPrompt = (
  playerColor: 'white' | 'black',
  latestOppositePlayerMove: string | null,
  gamePhase: 'opening' | 'middlegame' | 'endgame'
) => {
  const oppositePlayerColor = playerColor === 'white' ? 'black' : 'white';
  const moveText = latestOppositePlayerMove 
    ? `The latest move made by your opponent (${oppositePlayerColor}) is **${latestOppositePlayerMove}**.` 
    : `You're analyzing the initial position.`;

  let phaseSpecificAdvice = '';
  if (gamePhase === 'opening') {
    phaseSpecificAdvice = `
As this is the opening phase, focus on:
- Specific pawn and piece coordination for center control (d4, d5, e4, e5)
- Development order for knights and bishops (name specific squares)
- King safety and castling opportunities (specify kingside or queenside)
- Identification of the opening pattern if recognizable
- Early pawn structure implications`;
  } else if (gamePhase === 'middlegame') {
    phaseSpecificAdvice = `
In this middlegame position, analyze:
- Tactical patterns (pins, forks, discovered attacks) with specific pieces and squares
- Pawn break opportunities with exact coordinates
- Space advantages and outposts for pieces
- King safety weaknesses with specific attack vectors
- Piece coordination and activity imbalances`;
  } else {
    phaseSpecificAdvice = `
In this endgame position, focus on:
- Passed pawn dynamics and promotion pathways
- King activity and specific squares it should target
- Piece vs. pawn trade evaluations
- Zugzwang and opposition opportunities
- Critical squares for piece domination`;
  }

  return `### **Advanced Chess Position Analysis**  

You are analyzing a chess position for a player with **${playerColor}** pieces. ${moveText} 

Provide a precise Grandmaster-level analysis with concrete observations and specific coordinates. Your analysis should identify exact tactical opportunities and strategic themes.

${phaseSpecificAdvice}

---

### **Analysis Structure:**  

1. **Critical Position Elements:**  
   - Identify key pieces and their exact coordinates
   - Specify pawn structures and key squares they control
   - Note material balance and any significant imbalances
   - Identify weak squares and outposts with exact coordinates

2. **Opponent's Move Assessment:**  
   - Analyze the purpose of the opponent's last move
   - Identify any weaknesses or opportunities it created
   - Note how it impacts your strategic options

3. **Tactical Elements:**  
   - List any immediate threats, checks, or captures using precise coordinates
   - Identify tactical motifs (pins, forks, skewers) with the exact pieces involved
   - Highlight any overloaded or vulnerable pieces

4. **Strategic Considerations:**  
   - Provide 3-4 concrete strategic ideas with specific squares
   - Suggest pawn advances with exact coordinates
   - Identify piece maneuvers with specific origin and destination squares
   - Note structural changes that would benefit your position

5. **Defensive Requirements:**  
   - Specify weaknesses that need immediate defense
   - Identify undefended or vulnerable pieces with coordinates
   - Note any king safety concerns with specific squares

---

### **Guidelines:**
- Use algebraic chess coordinates extensively (e.g., "Knight on c3 controls e4 and d5")
- Be concrete and precise rather than general
- Provide balanced analysis but prioritize information useful to the ${playerColor} player
- Start with the most critical observations`;
};

// Determine game phase based on move count and material
const determineGamePhase = (gameState: GameState): 'opening' | 'middlegame' | 'endgame' => {
  const moveCount = gameState.history.length;
  
  // Simple heuristic based on move count
  if (moveCount < 10) {
    return 'opening';
  } else if (moveCount > 30) {
    return 'endgame';
  } else {
    return 'middlegame';
  }
};

// Analyze the chess board image
const analyzeChessboardImage = async (
  imageBase64: string,
  playerColor: 'white' | 'black',
  lastMove: Move | null,
  gameState: GameState
): Promise<string> => {
  try {
    // Get the last move in SAN format if it exists
    const lastMoveText = lastMove ? lastMove.san : null;
    
    // Determine the game phase
    const gamePhase = determineGamePhase(gameState);
    
    // Create vision prompt
    const visionPrompt = createVisionPrompt(playerColor, lastMoveText, gamePhase);
    
    // Prepare image data for API
    const imageData = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;
    
    // Make the API call to OpenAI Vision model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a chess Grandmaster providing detailed and coordinate-specific analysis of board positions."
        },
        {
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }
      ],
      max_tokens: 600,
    });

    // Return the analysis
    return response.choices[0]?.message?.content || "No analysis available.";
  } catch (error) {
    console.error("Error analyzing chessboard image:", error);
    return "Error analyzing the chess position. Please try again.";
  }
};

export const visionService = {
  analyzeChessboardImage
}; 