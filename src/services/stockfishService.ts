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

  constructor() {
    // Initialize worker async, don't block constructor
    this.initializeWorker().catch(error => {
      console.warn('⚠️ Stockfish failed to initialize, running in fallback mode:', error);
      this.isReady = false;
    });
  }

  private async initializeWorker() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log('🚀 Initializing Stockfish worker...');
        
        // Import the stockfish worker from public directory
        const stockfishPath = `${window.location.origin}/stockfish/stockfish-nnue-16-single.js`;
        console.log('📍 Worker path:', stockfishPath);
        
        // Try to load the worker with better error handling
        try {
          this.worker = new Worker(stockfishPath) as StockfishWorker;
        } catch (error) {
          console.error('❌ Failed to create Stockfish worker:', error);
          console.log('🔧 Using fallback mode without Stockfish');
          this.isReady = false;
          resolve(); // Resolve to allow fallback
          return;
        }
        
        // Set up timeout for initialization
        const initTimeout = setTimeout(() => {
          console.error('❌ Stockfish initialization timeout');
          console.log('🔧 Attempting fallback initialization...');
          // Don't reject immediately, try fallback
          this.isReady = false;
          clearTimeout(initTimeout);
          resolve(); // Resolve anyway to allow fallback
        }, 20000); // 20 second timeout
        
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
          console.error('❌ Stockfish worker error:', error);
          reject(error);
        };

        // Initialize the engine
        console.log('📤 Sending UCI command...');
        this.worker.postMessage('uci');
        
      } catch (error) {
        console.error('❌ Failed to initialize Stockfish worker:', error);
        reject(error);
      }
    });

    return this.initializationPromise;
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

  public async evaluatePosition(fen: string, callback: (result: EvaluationResult) => void) {
    console.log(`🔍 Evaluating position: ${fen}`);
    
    try {
      // Wait for worker to be ready
      await this.initializeWorker();
      
      console.log(`📋 Worker ready: ${this.isReady}, Worker exists: ${!!this.worker}`);
      
      if (!this.isReady || !this.worker) {
        console.warn('⚠️ Stockfish not ready, using fallback evaluation');
        // Fallback to simple evaluation
        callback({
          centipawns: 0,
          depth: 0
        });
        return;
      }

      this.currentCallback = callback;

      // Clear any previous analysis
      this.worker.postMessage('stop');
      
      // Set position and start analysis
      console.log('📤 Setting position and starting analysis...');
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage('go depth 8'); // Shallow analysis for speed

      // Timeout after 3 seconds to avoid hanging
      if (this.evaluationTimeout) {
        clearTimeout(this.evaluationTimeout);
      }
      
      this.evaluationTimeout = setTimeout(() => {
        console.warn('⏰ Analysis timeout, stopping Stockfish');
        this.worker?.postMessage('stop');
        this.currentCallback = null;
      }, 3000); // Increased to 3 seconds
      
    } catch (error) {
      console.error('❌ Error in evaluatePosition:', error);
      // Fallback evaluation
      callback({
        centipawns: 0,
        depth: 0
      });
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
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.initializationPromise = null;
  }
}

// Create singleton instance
export const stockfishService = new StockfishService();
export type { EvaluationResult }; 