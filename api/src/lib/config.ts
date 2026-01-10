export interface Config {
  MOI_RPC_URL: string;
  IDENTITY_LOGIC_ADDRESS: string | null;
  INTERACTION_LOGIC_ADDRESS: string | null;
  PORT: number;
  NODE_ENV: string;
}

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

let config: Config | null = null;

export function loadConfig(): Config {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // MOI_RPC_URL is always required
  const moiRpcUrl = process.env.MOI_RPC_URL || 'https://voyage-rpc.moi.technology/devnet/';
  if (!moiRpcUrl || moiRpcUrl.trim() === '') {
    throw new ConfigError('Missing required environment variable: MOI_RPC_URL');
  }

  // Contract addresses are required only in production
  const identityAddress = process.env.IDENTITY_LOGIC_ADDRESS;
  const interactionAddress = process.env.INTERACTION_LOGIC_ADDRESS;

  if (isProduction) {
    const missing: string[] = [];
    if (!identityAddress || identityAddress.trim() === '') {
      missing.push('IDENTITY_LOGIC_ADDRESS');
    }
    if (!interactionAddress || interactionAddress.trim() === '') {
      missing.push('INTERACTION_LOGIC_ADDRESS');
    }
    if (missing.length > 0) {
      throw new ConfigError(
        `Missing required environment variables in production: ${missing.join(', ')}`
      );
    }
  }

  const port = parseInt(process.env.PORT || '3001', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new ConfigError('PORT must be a valid number between 1 and 65535');
  }

  const loadedConfig: Config = {
    MOI_RPC_URL: moiRpcUrl,
    IDENTITY_LOGIC_ADDRESS: identityAddress?.trim() || null,
    INTERACTION_LOGIC_ADDRESS: interactionAddress?.trim() || null,
    PORT: port,
    NODE_ENV: nodeEnv,
  };

  config = loadedConfig;
  return loadedConfig;
}

export function getConfig(): Config {
  if (!config) {
    throw new ConfigError('Config not initialized. Call loadConfig() first.');
  }
  return config;
}

