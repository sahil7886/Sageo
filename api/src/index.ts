import app from './app.js';
import { loadConfig } from './lib/config.js';
import { initializeDeps } from './lib/deps.js';

const config = (() => {
  try {
    return loadConfig();
  } catch (error) {
    console.error('Failed to load configuration:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
})();

// Initialize dependencies
const deps = initializeDeps(config);

// Log configuration (redact any potential secrets)
console.log('Configuration loaded:');
console.log(`  MOI_RPC_URL: ${config.MOI_RPC_URL}`);
console.log(`  IDENTITY_LOGIC_ADDRESS: ${config.IDENTITY_LOGIC_ADDRESS || '(not configured)'}`);
console.log(`  INTERACTION_LOGIC_ADDRESS: ${config.INTERACTION_LOGIC_ADDRESS || '(not configured)'}`);
console.log(`  PORT: ${config.PORT}`);
console.log(`  NODE_ENV: ${config.NODE_ENV}`);

const server = app.listen(config.PORT, () => {
  console.log(`SageoExplorer API server running on port ${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Health check: http://localhost:${config.PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

