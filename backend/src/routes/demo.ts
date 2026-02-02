import { Router, Request, Response, NextFunction } from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple UUID generator since we can't import uuid
const uuidv4 = () => crypto.randomUUID();

const router = Router();

// Store active a2a-flow process
let a2aFlowProcess: ChildProcess | null = null;
let isAgentsReady = false;

// Check if agents are running
async function checkAgentsHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:4101/a2a/jsonrpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'health',
        id: 1
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Start a2a-flow agents
router.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if already running
    const isRunning = await checkAgentsHealth();
    if (isRunning) {
      return res.json({ 
        status: 'already_running',
        message: 'A2A agents are already running on ports 4101 and 4102'
      });
    }

    // Kill any existing process
    if (a2aFlowProcess) {
      a2aFlowProcess.kill();
      a2aFlowProcess = null;
    }

    // Spawn a2a-flow using npm run start
    // This ensures proper PATH and module resolution
    a2aFlowProcess = spawn('npm', ['run', 'start'], {
      cwd: path.resolve(__dirname, '../../a2a-flow'),
      env: { ...process.env, USER_MESSAGE: 'startup' },
      shell: true
    });

    let output = '';
    let errorOutput = '';

    a2aFlowProcess.stdout?.on('data', (data) => {
      const str = data.toString();
      output += str;
      console.log('[a2a-flow]', str);
      
      // Check if servers are ready
      if (str.includes('WeatherBot server listening') || str.includes('StockTrader server listening')) {
        isAgentsReady = true;
      }
    });

    a2aFlowProcess.stderr?.on('data', (data) => {
      const str = data.toString();
      errorOutput += str;
      console.error('[a2a-flow error]', str);
    });

    a2aFlowProcess.on('error', (err) => {
      console.error('[a2a-flow spawn error]', err);
    });

    a2aFlowProcess.on('exit', (code) => {
      console.log(`[a2a-flow] Process exited with code ${code}`);
      a2aFlowProcess = null;
    });

    // Wait for servers to be ready (max 30 seconds)
    const startTime = Date.now();
    while (!isAgentsReady && Date.now() - startTime < 30000) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!isAgentsReady) {
      a2aFlowProcess?.kill();
      throw new Error('Timeout waiting for A2A agents to start');
    }

    res.json({
      status: 'started',
      message: 'A2A agents started successfully',
      ports: { agent1: 4101, agent2: 4102 }
    });
  } catch (error) {
    next(error);
  }
});

// Send message to WeatherBot
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if agents are running
    const isRunning = await checkAgentsHealth();
    if (!isRunning) {
      return res.status(503).json({ 
        error: 'A2A agents not running',
        message: 'Please start agents first via POST /demo/start'
      });
    }

    const contextId = uuidv4();
    const messageId = uuidv4();

    // Send A2A message to WeatherBot
    const a2aResponse = await fetch('http://localhost:4101/a2a/jsonrpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'message/send',
        params: {
          message: {
            kind: 'message',
            messageId,
            role: 'user',
            parts: [{ kind: 'text', text: message }],
            contextId
          }
        },
        id: 1
      })
    });

    if (!a2aResponse.ok) {
      throw new Error(`A2A request failed: ${a2aResponse.status}`);
    }

    const result = await a2aResponse.json() as {
      result?: {
        parts?: Array<{ kind: string; text?: string }>;
        status?: {
          message?: {
            parts?: Array<{ kind: string; text?: string }>;
          };
        };
        metadata?: {
          [key: string]: {
            interaction_id?: string;
          };
        };
      };
    };
    
    // Extract text from response
    let responseText = 'No response';
    if (result.result?.parts) {
      const textPart = result.result.parts.find((p) => p.kind === 'text');
      if (textPart && textPart.text) {
        responseText = textPart.text;
      }
    } else if (result.result?.status?.message?.parts) {
      const textPart = result.result.status.message.parts.find((p) => p.kind === 'text');
      if (textPart && textPart.text) {
        responseText = textPart.text;
      }
    }

    // Extract interaction IDs from response metadata if available
    const sageoMetadata = result.result?.metadata?.['https://sageo.ai/extensions/trace'];
    const interactionId = sageoMetadata?.interaction_id || null;

    res.json({
      success: true,
      message: responseText,
      interactionId,
      contextId,
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
});

// Get agents status
router.get('/status', async (req: Request, res: Response) => {
  const isRunning = await checkAgentsHealth();
  res.json({
    running: isRunning,
    ports: isRunning ? { agent1: 4101, agent2: 4102 } : null
  });
});

// Stop agents
router.post('/stop', (req: Request, res: Response) => {
  if (a2aFlowProcess) {
    a2aFlowProcess.kill();
    a2aFlowProcess = null;
    isAgentsReady = false;
    res.json({ status: 'stopped' });
  } else {
    res.json({ status: 'not_running' });
  }
});

export default router;
