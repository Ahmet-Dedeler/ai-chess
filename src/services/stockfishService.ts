/**
 * Stockfish Service - Chess Engine Integration
 * 
 * This service provides integration with the Stockfish chess engine via Web Workers.
 * Stockfish is one of the world's strongest chess engines and is used here for:
 * - Real-time position evaluation
 * - Move analysis and scoring
 * - Providing objective assessment of chess positions
 * 
 * The service handles:
 * - Web Worker initialization and communication
 * - UCI (Universal Chess Interface) protocol
 * - Fallback handling when Stockfish is unavailable
 * - Timeout management for responsive UI
 */

// Extended Worker interface for type safety with Stockfish
interface StockfishWorker extends Worker {
  postMessage(message: string): void;
}

// Structure for position evaluation results from Stockfish
interface EvaluationResult {
  centipawns: number;  // Position evaluation in centipawns (1/100th of a pawn)
  mate?: number;       // Mate in X moves (if applicable)
  depth: number;       // Search depth achieved by the engine
}

class StockfishService {
  // Web Worker instance running Stockfish engine
  private worker: StockfishWorker | null = null;
  // Flag indicating if Stockfish is ready to receive commands
  private isReady = false;
  // Current callback function waiting for evaluation results
  private currentCallback: ((result: EvaluationResult) => void) | null = null;
  // Timeout handle for evaluation requests
  private evaluationTimeout: NodeJS.Timeout | null = null;
  // Promise to ensure worker initialization happens only once
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Initialize worker asynchronously to avoid blocking the constructor
    // This allows the application to start even if Stockfish fails to load
    this.initializeWorker().catch(error => {
      console.warn('⚠️ Stockfish failed to initialize, running in fallback mode:', error);
      this.isReady = false;
    });
  }

  /**
   * Initialize the Stockfish Web Worker
   * @private
   * @returns Promise that resolves when worker is ready or fails gracefully
   */
  private async initializeWorker() {
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log('🚀 Initializing Stockfish worker...');
        
        // Path to Stockfish WASM binary in public directory
        const stockfishPath = `${window.location.origin}/stockfish/stockfish-nnue-16-single.js`;
        console.log('📍 Worker path:', stockfishPath);
        
        // Attempt to create the Web Worker
        try {
          this.worker = new Worker(stockfishPath) as StockfishWorker;
        } catch (error) {
          console.error('❌ Failed to create Stockfish worker:', error);
          console.log('🔧 Using fallback mode without Stockfish');
          this.isReady = false;
          resolve(); // Resolve to allow application to continue without Stockfish
          return;
        }
        
        // Set up initialization timeout to prevent hanging
        const initTimeout = setTimeout(() => {
          console.error('❌ Stockfish initialization timeout');
          console.log('🔧 Attempting fallback initialization...');
          this.isReady = false;
          clearTimeout(initTimeout);
          resolve(); // Resolve anyway to allow fallback mode
        }, 20000); // 20 second timeout for slow connections
        
        // Handle messages from Stockfish worker
        this.worker.onmessage = (event) => {
          console.log('📨 Stockfish message:', event.data);
          
          // UCI protocol: 'uciok' indicates successful initialization
          if (event.data === 'uciok') {
            clearTimeout(initTimeout);
            console.log('✅ Stockfish UCI ready!');
            this.isReady = true;
            
            // Configure engine for optimal performance in web environment
            this.worker?.postMessage('setoption name Hash value 16');     // Limit memory usage
            this.worker?.postMessage('setoption name Threads value 1');   // Single thread for web
            this.worker?.postMessage('ucinewgame');                       // Prepare for new game
            console.log('⚙️ Stockfish configured for fast analysis');
            resolve();
          }
          
          // Route all messages to the message handler
          this.handleMessage(event.data);
        };

        // Handle worker errors
        this.worker.onerror = (error) => {
          clearTimeout(initTimeout);
          console.error('❌ Stockfish worker error:', error);
          reject(error);
        };

        // Start UCI initialization handshake
        console.log('📤 Sending UCI command...');
        this.worker.postMessage('uci');
        
      } catch (error) {
        console.error('❌ Failed to initialize Stockfish worker:', error);
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  /**
   * Handle incoming messages from Stockfish worker
   * @private
   * @param message - UCI protocol message from Stockfish
   */
  private handleMessage(message: string) {
    // Process different types of UCI messages
    if (message === 'uciok') {
      // UCI initialization complete - already handled in initializeWorker
      return;
    } else if (message.startsWith('info depth')) {
      // Position analysis information - parse and forward to callback
      this.parseEvaluation(message);
    } else if (message.startsWith('bestmove')) {
      console.log('🏁 Analysis complete:', message);
      // Analysis complete - clean up timeout
      if (this.evaluationTimeout) {
        clearTimeout(this.evaluationTimeout);
        this.evaluationTimeout = null;
      }
    }
  }

  /**
   * Parse UCI info string to extract position evaluation
   * @private
   * @param message - UCI info string containing evaluation data
   */
  private parseEvaluation(message: string) {
    // Parse UCI info format: "info depth 8 seldepth 10 multipv 1 score cp 24 nodes 12345 ..."
    const parts = message.split(' ');
    let centipawns = 0;
    let mate: number | undefined = undefined;
    let depth = 0;

    // Scan through message parts to extract relevant information
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'depth') {
        // Search depth reached by engine
        depth = parseInt(parts[i + 1]) || 0;
      } else if (parts[i] === 'score') {
        if (parts[i + 1] === 'cp') {
          // Centipawn evaluation (1/100th of a pawn value)
          centipawns = parseInt(parts[i + 2]) || 0;
        } else if (parts[i + 1] === 'mate') {
          // Forced mate in X moves
          mate = parseInt(parts[i + 2]) || 0;
          centipawns = mate > 0 ? 1000 : -1000; // Large value to indicate mate
        }
      }
    }

    // Only report evaluations with reasonable depth to avoid UI spam
    if (depth >= 3 && this.currentCallback) {
      console.log(`📊 Evaluation: cp=${centipawns}, depth=${depth}, mate=${mate}`);
      this.currentCallback({
        centipawns,
        mate,
        depth
      });
    }
  }

  /**
   * Evaluate a chess position using Stockfish
   * @param fen - FEN string representing the position to evaluate
   * @param callback - Function to call with evaluation results
   */
  public async evaluatePosition(fen: string, callback: (result: EvaluationResult) => void) {
    console.log(`🔍 Evaluating position: ${fen}`);
    
    try {
      // Ensure worker is initialized before proceeding
      await this.initializeWorker();
      
      console.log(`📋 Worker ready: ${this.isReady}, Worker exists: ${!!this.worker}`);
      
      // Fall back to neutral evaluation if Stockfish unavailable
      if (!this.isReady || !this.worker) {
        console.warn('⚠️ Stockfish not ready, using fallback evaluation');
        callback({
          centipawns: 0,  // Neutral position
          depth: 0        // No analysis depth
        });
        return;
      }

      // Set up callback for receiving results
      this.currentCallback = callback;

      // Stop any previous analysis to avoid interference
      this.worker.postMessage('stop');
      
      // Set the position and start analysis
      console.log('📤 Setting position and starting analysis...');
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage('go depth 8'); // Limited depth for responsive UI

      // Set timeout to prevent hanging on difficult positions
      if (this.evaluationTimeout) {
        clearTimeout(this.evaluationTimeout);
      }
      
      this.evaluationTimeout = setTimeout(() => {
        console.warn('⏰ Analysis timeout, stopping Stockfish');
        this.worker?.postMessage('stop');
        this.currentCallback = null;
      }, 3000); // 3 second timeout for responsive UI
      
    } catch (error) {
      console.error('❌ Error in evaluatePosition:', error);
      // Provide fallback evaluation on error
      callback({
        centipawns: 0,
        depth: 0
      });
    }
  }

  /**
   * Stop any ongoing analysis
   */
  public stop() {
    if (this.worker) {
      this.worker.postMessage('stop');
      this.currentCallback = null;
    }
    
    if (this.evaluationTimeout) {
      clearTimeout(this.evaluationTimeout);
      this.evaluationTimeout = null;
    }
  }

  /**
   * Clean up resources and terminate the worker
   * Should be called when the service is no longer needed
   */
  public destroy() {
    console.log('🗑️ Destroying Stockfish service');
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.initializationPromise = null;
  }
}

// Create and export singleton instance for use throughout the application
export const stockfishService = new StockfishService();
export type { EvaluationResult };