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
  private initializationFailed = false;

  constructor() {
    // Lazy initialization: do not start worker immediately
    // Worker will be initialized on first use
    // But keep robust async error handling for fallback
    // No immediate initialization here
  }

  /**
   * Initialize the Stockfish Web Worker
   * @private
   * @returns Promise that resolves when worker is ready or fails gracefully
   */
  private async initializeWorker() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    if (this.initializationFailed) {
      return Promise.reject(new Error('Stockfish initialization previously failed'));
    }
    this.initializationPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log('🚀 Initializing Stockfish worker...');
        const stockfishPath = `${window.location.origin}/stockfish/stockfish-nnue-16-single.js`;
        console.log('📍 Worker path:', stockfishPath);
        try {
          this.worker = new Worker(stockfishPath) as StockfishWorker;
        } catch (error) {
          console.error('❌ Failed to create Stockfish worker:', error);
          console.log('🔧 Using fallback mode without Stockfish');
          this.isReady = false;
          resolve();
          return;
        }
        // Use a reasonable timeout (10s)
        const initTimeout = setTimeout(() => {
          console.warn('⚠️ Stockfish initialization timeout - falling back to simple evaluation');
          this.initializationFailed = true;
          this.cleanup();
          reject(new Error('Stockfish initialization timeout'));
        }, 10000);
        this.worker.onmessage = (event) => {
          console.log('📨 Stockfish message:', event.data);
          if (event.data === 'uciok') {
            clearTimeout(initTimeout);
            console.log('✅ Stockfish UCI ready!');
            this.isReady = true;
            this.worker?.postMessage('setoption name Hash value 16');
            this.worker?.postMessage('setoption name Threads value 1');
            this.worker?.postMessage('ucinewgame');
            console.log('⚙️ Stockfish configured for fast analysis');
            resolve();
          }
          this.handleMessage(event.data);
        };
        this.worker.onerror = (error) => {
          clearTimeout(initTimeout);
          console.warn('⚠️ Stockfish worker error - falling back to simple evaluation:', error);
          this.initializationFailed = true;
          this.cleanup();
          reject(error);
        };
        console.log('📤 Sending UCI command...');
        this.worker.postMessage('uci');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Stockfish worker - falling back to simple evaluation:', error);
        this.initializationFailed = true;
        this.cleanup();
        reject(error);
      }
    });
    return this.initializationPromise;
  }

  private cleanup() {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.worker = null;
    }
    this.isReady = false;
  }

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

  // Simple fallback evaluation based on material count
  private getSimpleEvaluation(fen: string): EvaluationResult {
    try {
      const position = fen.split(' ')[0];
      const pieceValues: { [key: string]: number } = {
        'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': 0,
        'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0
      };
      let evaluation = 0;
      for (const char of position) {
        if (pieceValues[char] !== undefined) {
          evaluation += pieceValues[char];
        }
      }
      const centipawns = evaluation * 100 + (Math.random() - 0.5) * 20;
      return {
        centipawns: Math.round(centipawns),
        depth: 1
      };
    } catch (error) {
      console.warn('Error in simple evaluation:', error);
      return { centipawns: 0, depth: 0 };
    }
  }

  public async evaluatePosition(fen: string, callback: (result: EvaluationResult) => void) {
    console.log(`🔍 Evaluating position: ${fen}`);
    try {
      await this.initializeWorker();
      console.log(`📋 Worker ready: ${this.isReady}, Worker exists: ${!!this.worker}`);
      if (!this.isReady || !this.worker) {
        // Use fallback evaluation if Stockfish is not ready
        const simpleResult = this.getSimpleEvaluation(fen);
        setTimeout(() => callback(simpleResult), 100);
        return;
      }
      this.currentCallback = callback;
      this.worker.postMessage('stop');
      console.log('📤 Setting position and starting analysis...');
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage('go depth 8'); // Use a reasonable depth
      if (this.evaluationTimeout) {
        clearTimeout(this.evaluationTimeout);
      }
      this.evaluationTimeout = setTimeout(() => {
        console.warn('⏰ Analysis timeout, stopping Stockfish');
        this.worker?.postMessage('stop');
        this.currentCallback = null;
      }, 3000); // 3 second timeout
    } catch (error) {
      console.warn('⚠️ Stockfish evaluation failed, using simple evaluation:', error);
      const simpleResult = this.getSimpleEvaluation(fen);
      setTimeout(() => callback(simpleResult), 100);
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
    this.cleanup();
    this.initializationPromise = null;
    this.initializationFailed = false;
  }

  // Check if Stockfish is available
  public get isStockfishAvailable(): boolean {
    return this.isReady && !this.initializationFailed;
  }
}

// Create and export singleton instance for use throughout the application
export const stockfishService = new StockfishService();
export type { EvaluationResult };