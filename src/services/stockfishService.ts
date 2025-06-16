interface StockfishWorker extends Worker {
  postMessage(message: string): void;
}

interface EvaluationResult {
  centipawns: number;
  mate?: number;
  depth: number;
}

class StockfishService {
  private worker: StockfishWorker | null = null;
  private isReady = false;
  private currentCallback: ((result: EvaluationResult) => void) | null = null;
  private evaluationTimeout: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;
  private initializationFailed = false;

  constructor() {
    // Don't initialize immediately, let it be lazy-loaded
  }

  private async initializeWorker() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If initialization failed before, don't try again
    if (this.initializationFailed) {
      return Promise.reject(new Error('Stockfish initialization previously failed'));
    }

    this.initializationPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log('🚀 Initializing Stockfish worker...');
        
        // Import the stockfish worker from public directory
        const stockfishPath = `${window.location.origin}/stockfish/stockfish-nnue-16-single.js`;
        console.log('📍 Worker path:', stockfishPath);
        
        this.worker = new Worker(stockfishPath) as StockfishWorker;
        
        // Set up timeout for initialization - shorter timeout with better handling
        const initTimeout = setTimeout(() => {
          console.warn('⚠️ Stockfish initialization timeout - falling back to simple evaluation');
          this.initializationFailed = true;
          this.cleanup();
          reject(new Error('Stockfish initialization timeout'));
        }, 5000); // Reduced to 5 seconds
        
        this.worker.onmessage = (event) => {
          console.log('📨 Stockfish message:', event.data);
          
          if (event.data === 'uciok') {
            clearTimeout(initTimeout);
            console.log('✅ Stockfish UCI ready!');
            this.isReady = true;
            // Set options for faster evaluation
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

        // Initialize the engine
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
    // Handle UCI protocol messages
    if (message === 'uciok') {
      // Already handled in initializeWorker
      return;
    } else if (message.startsWith('info depth')) {
      this.parseEvaluation(message);
    } else if (message.startsWith('bestmove')) {
      console.log('🏁 Analysis complete:', message);
      // Analysis complete
      if (this.evaluationTimeout) {
        clearTimeout(this.evaluationTimeout);
        this.evaluationTimeout = null;
      }
    }
  }

  private parseEvaluation(message: string) {
    // Parse UCI info string for evaluation
    // Example: "info depth 8 seldepth 10 multipv 1 score cp 24 nodes 12345 ..."
    const parts = message.split(' ');
    let centipawns = 0;
    let mate: number | undefined = undefined;
    let depth = 0;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'depth') {
        depth = parseInt(parts[i + 1]) || 0;
      } else if (parts[i] === 'score') {
        if (parts[i + 1] === 'cp') {
          centipawns = parseInt(parts[i + 2]) || 0;
        } else if (parts[i + 1] === 'mate') {
          mate = parseInt(parts[i + 2]) || 0;
          centipawns = mate > 0 ? 1000 : -1000; // Large value for mate
        }
      }
    }

    // Only call callback for reasonable depth (avoid spam)
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
      // Extract piece positions from FEN
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

      // Convert to centipawns and add some randomness
      const centipawns = evaluation * 100 + (Math.random() - 0.5) * 20;
      
      return {
        centipawns: Math.round(centipawns),
        depth: 1 // Indicate this is a simple evaluation
      };
    } catch (error) {
      console.warn('Error in simple evaluation:', error);
      return { centipawns: 0, depth: 0 };
    }
  }

  public async evaluatePosition(fen: string, callback: (result: EvaluationResult) => void) {
    console.log(`🔍 Evaluating position: ${fen}`);
    
    try {
      // Try to initialize Stockfish, but don't block on failure
      await this.initializeWorker();
      
      console.log(`📋 Worker ready: ${this.isReady}, Worker exists: ${!!this.worker}`);
      
      if (!this.isReady || !this.worker) {
        throw new Error('Stockfish not ready');
      }

      this.currentCallback = callback;

      // Clear any previous analysis
      this.worker.postMessage('stop');
      
      // Set position and start analysis
      console.log('📤 Setting position and starting analysis...');
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage('go depth 6'); // Reduced depth for faster response

      // Timeout after 2 seconds to avoid hanging
      if (this.evaluationTimeout) {
        clearTimeout(this.evaluationTimeout);
      }
      
      this.evaluationTimeout = setTimeout(() => {
        console.warn('⏰ Analysis timeout, stopping Stockfish');
        this.worker?.postMessage('stop');
        this.currentCallback = null;
      }, 2000); // Reduced to 2 seconds
      
    } catch (error) {
      console.warn('⚠️ Stockfish evaluation failed, using simple evaluation:', error);
      // Use simple fallback evaluation
      const simpleResult = this.getSimpleEvaluation(fen);
      setTimeout(() => callback(simpleResult), 100); // Small delay to simulate analysis
    }
  }

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

// Export singleton instance
export const stockfishService = new StockfishService();
export type { EvaluationResult }; 